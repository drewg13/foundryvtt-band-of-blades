//import DND5E from "./dnd5e.js";
//import BitD from "./blades-in-the-dark.js";
import SaV from "./scum-and-villainy.js";
import BoB from "./band-of-blades.js";

const SUPPORTED_SYSTEMS = {
  //"blades-in-the-dark": BitD,
  //"dnd5e": DND5E,
  "scum-and-villainy": SaV,
  "band-of-blades": BoB
};

const defaultLoadClockFromActor = ({ actor }) => {
  return {
    progress: actor.getFlag("band-of-blades", "clocks.progress"),
    size: actor.getFlag("band-of-blades", "clocks.size"),
    theme: actor.getFlag("band-of-blades", "clocks.theme")
  };
};

const defaultPersistClockToActor = async ({ clock }) => {
  return {
    flags: {
      "band-of-blades": {
	    clocks: {
          progress: clock.progress,
          size: clock.size,
          theme: clock.theme
        }
      }
	}
  };
};

export const getSystemMapping = (id) => {
  const defaultSystemConfig = {
    loadClockFromActor: defaultLoadClockFromActor,
    persistClockToActor: defaultPersistClockToActor
  };

  if (!SUPPORTED_SYSTEMS[id]) {
    return {
      id,
      ...defaultSystemConfig,
      registerSheetOptions: {
        types: game.data.system.template.Actor.types
      }
    };
  }

  return {
    id,
    ...defaultSystemConfig,
    ...SUPPORTED_SYSTEMS[id]
  };
};
