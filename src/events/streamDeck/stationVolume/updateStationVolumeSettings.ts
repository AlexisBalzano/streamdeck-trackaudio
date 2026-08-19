import { StationVolumeSettings } from "@actions/stationVolume";
import { DialAction } from "@elgato/streamdeck";
import actionManager from "@managers/action";
import slotAssigner from "@managers/slotAssigner";
import trackAudioManager from "@managers/trackAudio";

/**
 * Updates the settings associated with a station volume action.
 * @param action The action to update
 * @param settings The new settings to use
 */
export const handleUpdateStationVolumeSettings = (
  action: DialAction,
  settings: StationVolumeSettings
) => {
  const savedAction = actionManager
    .getStationVolumeControllers()
    .find((entry) => entry.action.id === action.id);

  if (!savedAction) {
    return;
  }

  const refreshRequired = savedAction.callsign !== settings.callsign;
  const reassignmentRequired =
    savedAction.isDynamic !== (settings.dynamic ?? false);

  savedAction.settings = settings;

  if (reassignmentRequired) {
    slotAssigner.assign();
  }

  if (refreshRequired) {
    trackAudioManager.refreshStationState(savedAction.callsign);
  }
};
