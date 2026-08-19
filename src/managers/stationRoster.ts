import { EventEmitter } from "events";

/**
 * A station tracked by TrackAudio.
 */
export interface RosterStation {
  callsign: string;
  frequency: number;
}

// TrackAudio always provides these, so they never consume a slot.
const excludedCallsigns = ["GUARD", "UNICOM"];

/**
 * Singleton class that tracks the stations in TrackAudio and the slot each one
 * occupies. Slots are stable: a station keeps its slot for as long as it exists
 * and a removed station leaves a hole for the next new station to reuse.
 */
class StationRosterManager extends EventEmitter {
  private static instance: StationRosterManager | null = null;
  private _slots: (RosterStation | undefined)[] = [];

  private constructor() {
    super();
  }

  /**
   * Provides access to the StationRosterManager instance.
   * @returns The instance of StationRosterManager
   */
  public static getInstance(): StationRosterManager {
    StationRosterManager.instance ??= new StationRosterManager();
    return StationRosterManager.instance;
  }

  /**
   * Gets the slots, in order. Holes are left where a station was removed.
   * @returns {(RosterStation | undefined)[]} The slots
   */
  get slots(): (RosterStation | undefined)[] {
    return this._slots;
  }

  /**
   * Replaces the roster with the provided stations, preserving the slot of any
   * station that is in both the old and new list.
   * @param stations The complete list of stations from TrackAudio
   */
  public update(stations: RosterStation[]) {
    const snapshot = this.snapshot();
    const incoming = stations.filter((station) => this.isTrackable(station));
    const callsigns = incoming.map((station) => station.callsign);

    this._slots = this._slots.map((slot) =>
      slot && callsigns.includes(slot.callsign) ? slot : undefined
    );

    incoming.forEach((station) => {
      this.place(station);
    });

    this.trimTrailingHoles();
    this.emitIfChanged(snapshot);
  }

  /**
   * Adds a station to the roster, reusing the first free slot.
   * @param station The station to add
   */
  public add(station: RosterStation) {
    if (!this.isTrackable(station)) {
      return;
    }

    const snapshot = this.snapshot();

    this.place(station);
    this.emitIfChanged(snapshot);
  }

  /**
   * Removes the station using the frequency, leaving its slot free.
   * @param frequency The frequency of the station to remove
   */
  public removeByFrequency(frequency: number) {
    const snapshot = this.snapshot();

    this._slots = this._slots.map((slot) =>
      slot?.frequency === frequency ? undefined : slot
    );

    this.trimTrailingHoles();
    this.emitIfChanged(snapshot);
  }

  /**
   * Clears the roster.
   */
  public reset() {
    const snapshot = this.snapshot();

    this._slots = [];
    this.emitIfChanged(snapshot);
  }

  /**
   * Determines whether a station should occupy a slot.
   * @param station The station to check
   * @returns True if the station is trackable
   */
  private isTrackable(station: RosterStation): boolean {
    return (
      station.callsign !== "" && !excludedCallsigns.includes(station.callsign)
    );
  }

  /**
   * Puts the station in its existing slot, or the first free one.
   * @param station The station to place
   */
  private place(station: RosterStation) {
    const existing = this._slots.findIndex(
      (slot) => slot?.callsign === station.callsign
    );

    if (existing !== -1) {
      this._slots[existing] = station;
      return;
    }

    const free = this._slots.findIndex((slot) => slot === undefined);

    if (free !== -1) {
      this._slots[free] = station;
      return;
    }

    this._slots.push(station);
  }

  /**
   * Drops empty slots off the end of the roster.
   */
  private trimTrailingHoles() {
    while (this._slots.length > 0 && this._slots.at(-1) === undefined) {
      this._slots.pop();
    }
  }

  /**
   * Takes a comparable snapshot of the current slots.
   * @returns The snapshot
   */
  private snapshot(): string {
    return this._slots
      .map(
        (slot) =>
          `${slot?.callsign ?? ""}:${slot?.frequency.toString() ?? ""}`
      )
      .join("|");
  }

  /**
   * Emits rosterChanged if the slots differ from the snapshot.
   * @param snapshot The snapshot taken before the change
   */
  private emitIfChanged(snapshot: string) {
    if (this.snapshot() !== snapshot) {
      this.emit("rosterChanged");
    }
  }
}

const stationRosterManagerInstance = StationRosterManager.getInstance();
export default stationRosterManagerInstance;
