import actionManager from "@managers/action";
import stationRoster from "@managers/stationRoster";
import vatsimManager from "@managers/vatsim";

export const handleDisconnected = () => {
  stationRoster.reset();
  actionManager.resetAll();
  vatsimManager.stop();
};
