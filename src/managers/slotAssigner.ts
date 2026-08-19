import { StationStatusController } from "@controllers/stationStatus";
import { StationVolumeController } from "@controllers/stationVolume";
import actionManager from "@managers/action";
import stationRoster, { RosterStation } from "@managers/stationRoster";
import trackAudioManager from "@managers/trackAudio";
import mainLogger from "@utils/logger";
import { buildSlotGroups, GroupableSlot, SlotGroup } from "@utils/slotGrouping";
import debounce from "debounce";

const logger = mainLogger.child({ service: "slotAssigner" });

/**
 * Singleton class that maps the stations in the roster onto the dynamic
 * actions currently visible on the Stream Deck.
 */
class SlotAssignerManager {
  private static instance: SlotAssignerManager | null = null;
  private static readonly ASSIGNMENT_DELAY_MS = 250;

  private constructor() {
    // Nothing to do.
  }

  /**
   * Provides access to the SlotAssignerManager instance.
   * @returns The instance of SlotAssignerManager
   */
  public static getInstance(): SlotAssignerManager {
    SlotAssignerManager.instance ??= new SlotAssignerManager();
    return SlotAssignerManager.instance;
  }

  /**
   * Assigns roster stations to the visible dynamic actions.
   * @remarks This method is debounced to let page changes settle first.
   */
  public assign = debounce(() => {
    this.assignStations();
  }, SlotAssignerManager.ASSIGNMENT_DELAY_MS);

  /**
   * Groups the visible dynamic actions and gives each group a station.
   */
  private assignStations() {
    const controllers = this.getDynamicStatusControllers();
    const slots = controllers
      .map((controller) => this.toGroupableSlot(controller))
      .filter((slot) => slot !== undefined);

    const groups = buildSlotGroups(slots);
    const { slots: stations } = stationRoster;

    // Logged in full so a wrong axis guess is diagnosable from the log.
    logger.debug(
      `Assigning ${stations.length.toString()} stations: ${groups
        .map(
          (group, index) =>
            `(${group.column.toString()},${group.row.toString()})x${group.ids.length.toString()}=${
              stations[index]?.callsign ?? "empty"
            }`
        )
        .join(" ")}`
    );

    const byId = new Map(
      controllers.map((controller) => [controller.action.id, controller])
    );

    const keyFrequencies = groups.flatMap((group, index) =>
      group.ids.map((id) => this.applyStation(byId.get(id), stations[index]))
    );

    const dialFrequencies = this.getDynamicVolumeControllers().map(
      (controller, index) =>
        this.applyStation(
          controller,
          this.stationForDial(controller, groups, index)
        )
    );

    const assigned = new Set(
      [...keyFrequencies, ...dialFrequencies].filter(
        (frequency) => frequency !== 0
      )
    );

    if (assigned.size === 0) {
      return;
    }

    // The roster only carries the callsign and frequency, so ask TrackAudio for
    // the listen states of the stations that just landed on an action.
    trackAudioManager.refreshStationStates();

    assigned.forEach((frequency) => {
      actionManager.autoSet(frequency);
    });
  }

  /**
   * Finds the station for a dial, preferring the group in the dial's own column.
   * @param controller The dial to find a station for
   * @param groups The groups the keys were assigned from
   * @param index The position of the dial among the dynamic dials
   * @returns The station, or undefined if there isn't one
   */
  private stationForDial(
    controller: StationVolumeController,
    groups: SlotGroup[],
    index: number
  ): RosterStation | undefined {
    const { column } = controller.action.coordinates;
    const deviceId = controller.action.device.id;

    const matched = groups.findIndex(
      (group) => group.deviceId === deviceId && group.column === column
    );

    return stationRoster.slots[matched !== -1 ? matched : index];
  }

  /**
   * Applies a station to a controller.
   * @param controller The controller to update
   * @param station The station to display, or undefined for an empty slot
   * @returns The frequency of a newly assigned station, or 0 if nothing was assigned
   */
  private applyStation(
    controller: StationStatusController | StationVolumeController | undefined,
    station: RosterStation | undefined
  ): number {
    if (!controller) {
      return 0;
    }

    const { assignedStation } = controller;

    if (
      assignedStation?.callsign === station?.callsign &&
      assignedStation?.frequency === station?.frequency
    ) {
      return 0;
    }

    controller.assignedStation = station;
    return station?.frequency ?? 0;
  }

  /**
   * Converts a controller to a slot, skipping actions in a multi-action since
   * those have no coordinates to group by.
   * @param controller The controller to convert
   * @returns The slot, or undefined if the action can't be grouped
   */
  private toGroupableSlot(
    controller: StationStatusController
  ): GroupableSlot | undefined {
    const { coordinates } = controller.action;

    if (!coordinates) {
      return undefined;
    }

    return {
      id: controller.action.id,
      deviceId: controller.action.device.id,
      column: coordinates.column,
      row: coordinates.row,
      role: controller.slotRole,
    };
  }

  /**
   * Retrieves the dynamic station status controllers.
   * @returns The controllers
   */
  private getDynamicStatusControllers(): StationStatusController[] {
    return actionManager
      .getStationStatusControllers()
      .filter((controller) => controller.isDynamic);
  }

  /**
   * Retrieves the dynamic station volume controllers, in a stable order.
   * @returns The controllers
   */
  private getDynamicVolumeControllers(): StationVolumeController[] {
    return actionManager
      .getStationVolumeControllers()
      .filter((controller) => controller.isDynamic)
      .sort(
        (a, b) =>
          a.action.device.id.localeCompare(b.action.device.id) ||
          a.action.coordinates.column - b.action.coordinates.column ||
          a.action.coordinates.row - b.action.coordinates.row
      );
  }
}

const slotAssignerManagerInstance = SlotAssignerManager.getInstance();
export default slotAssignerManagerInstance;
