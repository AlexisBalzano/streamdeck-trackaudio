import { StationAdded } from "@interfaces/messages";
import actionManager from "@managers/action";
import stationRoster from "@managers/stationRoster";

export const handleStationAdded = (data: StationAdded) => {
  stationRoster.add({
    callsign: data.value.callsign,
    frequency: data.value.frequency,
  });

  actionManager.setStationFrequency(data.value.callsign, data.value.frequency);
  actionManager.autoSet(data.value.frequency);
};
