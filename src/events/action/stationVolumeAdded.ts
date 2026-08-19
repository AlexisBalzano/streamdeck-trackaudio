import { StationVolumeController } from "@controllers/stationVolume";
import slotAssigner from "@managers/slotAssigner";
import trackAudioManager from "@managers/trackAudio";

export const handleStationVolumeAdded = (
  controller: StationVolumeController
) => {
  slotAssigner.assign();

  if (trackAudioManager.isConnected) {
    trackAudioManager.refreshStationState(controller.callsign);
  }
};
