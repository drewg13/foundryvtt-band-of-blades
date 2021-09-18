export const registerSystemSettings = function() {

  /**
   * Track the system version upon which point a migration was last applied
   */
  game.settings.register("band-of-blades", "systemMigrationVersion", {
    name: "System Migration Version",
    scope: "world",
    config: false,
    type: Number,
    default: 0
  });
  
  game.settings.register("band-of-blades", "defaultClockTheme", {
    name: "BITD.ClockSettingDefaultTheme",
    hint: "BITD.ClockSettingDefaultThemeHint",
    scope: "world",
    config: true,
    type: Number,
    choices: game.system.bobclocks.themes,
	  default: 0,
	  icon: "fas fa-palette"
  });

  game.settings.register("band-of-blades", "defaultAttributeXPBarSize", {
    name: "BITD.AttributeXPBarSize",
    hint: "BITD.AttributeXPBarSizeHint",
    scope: "world",
    config: true,
    type: Number,
    range: {
      min: 1,
      max: 12,
      step: 1
    },
    default: 6
  });

  game.settings.register("band-of-blades", "defaultPlaybookXPBarSize", {
    name: "BITD.PlaybookXPBarSize",
    hint: "BITD.PlaybookXPBarSizeHint",
    scope: "world",
    config: true,
    type: Number,
    range: {
      min: 1,
      max: 12,
      step: 1
    },
    default: 8
  });

};
