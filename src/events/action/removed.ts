import actionManager from "@managers/action";
import slotAssigner from "@managers/slotAssigner";
import vatsimManager from "@managers/vatsim";
import svgManager from "@managers/svg";

export const handleRemoved = (count: number) => {
  slotAssigner.assign();

  if (count === 0) {
    svgManager.reset();
  }

  // If there are no more ATIS letter actions then stop polling VATSIM.
  if (actionManager.getAtisLetterControllers().length === 0) {
    vatsimManager.stop();
  }
};
