import { StationStates } from "@interfaces/messages";
import actionManager from "@managers/action";
import stationRoster from "@managers/stationRoster";
import { handleStationStateUpdate } from "./stationStateUpdate";

/**
 * Receives the state of all active stations from TrackAudio and updates the appropriate
 * Stream Deck actions with the new data.
 */
export const handleStationStates = (data: StationStates) => {
  // Refresh the roster first so dynamic actions have a callsign before the
  // state updates get matched against them.
  stationRoster.update(
    data.value.stations.map((station) => ({
      callsign: station.value.callsign ?? "",
      frequency: station.value.frequency,
    }))
  );

  // Update the states for all the received data
  data.value.stations.forEach((station) => {
    handleStationStateUpdate(station);
  });

  // Update the stations that aren't available
  actionManager.updateStationsIsAvailable(data.value.stations);
};
