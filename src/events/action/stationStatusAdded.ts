import { StationStatusController } from "@controllers/stationStatus";
import trackAudioManager from "@managers/trackAudio";
import actionManager from "@managers/action";
import slotAssigner from "@managers/slotAssigner";

export const handleStationStatusAdded = (
  controller: StationStatusController
) => {
  // Any new action changes the layout the slots are grouped from, even a fixed
  // one, since it breaks the run of dynamic actions around it.
  slotAssigner.assign();

  if (trackAudioManager.isConnected) {
    trackAudioManager.refreshStationState(controller.callsign);
    actionManager.trackProfileChanged();
  }
};
