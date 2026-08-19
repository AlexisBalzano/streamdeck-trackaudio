/**
 * A dynamic action that can be grouped with its neighbours.
 */
export interface GroupableSlot {
  id: string;
  deviceId: string;
  column: number;
  row: number;
  role: string;
}

/**
 * A set of slots that all display the same station.
 */
export interface SlotGroup {
  ids: string[];
  deviceId: string;
  column: number;
  row: number;
}

type Axis = "column" | "row";

/**
 * Builds the role key used to decide whether two adjacent slots belong to the
 * same station. Callsign history buttons leave listenTo at its default so the
 * history flag has to be part of the key.
 * @param listenTo The listenTo setting
 * @param showLastReceivedCallsign True if the action displays callsign history
 * @returns The role key
 */
export const buildSlotRole = (
  listenTo: string,
  showLastReceivedCallsign: boolean
): string => {
  return `${listenTo}${showLastReceivedCallsign ? "+lc" : ""}`;
};

/**
 * Walks the slots along the specified axis, breaking a run whenever a role
 * repeats or a position is empty.
 * @param slots The slots on a single device
 * @param axis The axis to walk along
 * @returns The groups found along the axis
 */
const scanAxis = (slots: GroupableSlot[], axis: Axis): SlotGroup[] => {
  const positions = new Map<string, GroupableSlot>();
  slots.forEach((slot) => {
    positions.set(`${slot.column.toString()},${slot.row.toString()}`, slot);
  });

  const lines = new Set(
    slots.map((slot) => (axis === "column" ? slot.column : slot.row))
  );

  const groups: SlotGroup[] = [];

  Array.from(lines)
    .sort((a, b) => a - b)
    .forEach((line) => {
      const crossValues = slots
        .filter((slot) => (axis === "column" ? slot.column : slot.row) === line)
        .map((slot) => (axis === "column" ? slot.row : slot.column))
        .sort((a, b) => a - b);

      let current: GroupableSlot[] = [];
      let previous: number | undefined;

      const closeRun = () => {
        if (current.length > 0) {
          const [anchor] = current;
          groups.push({
            ids: current.map((slot) => slot.id),
            deviceId: anchor.deviceId,
            column: anchor.column,
            row: anchor.row,
          });
          current = [];
        }
      };

      crossValues.forEach((cross) => {
        const key =
          axis === "column"
            ? `${line.toString()},${cross.toString()}`
            : `${cross.toString()},${line.toString()}`;
        const slot = positions.get(key);

        if (!slot) {
          return;
        }

        const isAdjacent = previous !== undefined && cross === previous + 1;
        const isDuplicateRole = current.some(
          (entry) => entry.role === slot.role
        );

        if (!isAdjacent || isDuplicateRole) {
          closeRun();
        }

        current.push(slot);
        previous = cross;
      });

      closeRun();
    });

  return groups;
};

/**
 * Counts the slots that ended up in a group with more than one member.
 * @param groups The groups to score
 * @returns The number of grouped slots
 */
const scoreAxis = (groups: SlotGroup[]): number => {
  return groups
    .filter((group) => group.ids.length > 1)
    .reduce((total, group) => total + group.ids.length, 0);
};

/**
 * Groups slots so that adjacent actions with different roles display the same
 * station. The axis producing the most grouped slots wins, with ties going to
 * columns.
 * @param slots All the dynamic slots currently visible
 * @returns The groups, in the order stations should be assigned to them
 */
export const buildSlotGroups = (slots: GroupableSlot[]): SlotGroup[] => {
  const deviceIds = Array.from(
    new Set(slots.map((slot) => slot.deviceId))
  ).sort((a, b) => a.localeCompare(b));

  return deviceIds.flatMap((deviceId) => {
    const deviceSlots = slots.filter((slot) => slot.deviceId === deviceId);

    const columnGroups = scanAxis(deviceSlots, "column");
    const rowGroups = scanAxis(deviceSlots, "row");

    const useColumns = scoreAxis(columnGroups) >= scoreAxis(rowGroups);
    const groups = useColumns ? columnGroups : rowGroups;

    return groups.sort((a, b) =>
      useColumns
        ? a.column - b.column || a.row - b.row
        : a.row - b.row || a.column - b.column
    );
  });
};
