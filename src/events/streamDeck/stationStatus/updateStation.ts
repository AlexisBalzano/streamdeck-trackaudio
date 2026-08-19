import { StationStatusSettings } from "@actions/stationStatus";
import { KeyAction } from "@elgato/streamdeck";
import actionManager from "@managers/action";
import slotAssigner from "@managers/slotAssigner";

/**
 * Updates the settings associated with a station status action.
 * Emits a stationStatusSettingsUpdated event if the settings require
 * the action to refresh.
 * @param action The action to update
 * @param settings The new settings to use
 */
export const handleUpdateStation = (
  action: KeyAction,
  settings: StationStatusSettings
) => {
  const savedAction = actionManager
    .getStationStatusControllers()
    .find((entry) => entry.action.id === action.id);

  if (!savedAction) {
    return;
  }

  // This avoids unnecessary calls to TrackAudio when the callsign or listenTo settings
  // didn't change.
  const requiresStationRefresh =
    savedAction.callsign !== settings.callsign ||
    savedAction.listenTo !== (settings.listenTo ?? "rx");

  // listenTo and the callsign history are both part of the slot role, so any of
  // these changes can regroup the slots.
  const requiresReassignment =
    requiresStationRefresh ||
    savedAction.isDynamic !== (settings.dynamic ?? false) ||
    savedAction.showLastReceivedCallsign !==
      ((settings.lastReceivedCallsignCount ?? 0) > 0);

  savedAction.settings = settings;

  if (requiresReassignment) {
    slotAssigner.assign();
  }

  if (requiresStationRefresh) {
    actionManager.emit("stationStatusSettingsUpdated", savedAction);
  }
};
