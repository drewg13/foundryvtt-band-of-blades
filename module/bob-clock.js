const nextIndexInArray = (arr, el) => {
  const idx = arr.indexOf(el);
  return (idx < 0 || idx >= arr.length) ? 0 : idx + 1;
}

export class BoBClock {
  static get sizes () {
      return game.system.bobclocks.sizes;
  }

  static get themes () {
	  const default_t = game.system.bobclocks.themes[ game.settings.get( "band-of-blades", "defaultClockTheme" ) ];
	  let curr_t = game.system.bobclocks.themes;

	  if ( curr_t.indexOf( default_t ) !== 0 ) {
		  curr_t = curr_t.filter( x => x !== default_t );
	  	curr_t.unshift( default_t );
	  }

	  return curr_t;
  }

  constructor ({ theme, size, progress } = {}) {
    const isSupportedSize = size && BoBClock.sizes.indexOf(parseInt(size)) >= 0;
    this._size = isSupportedSize ? parseInt(size) : BoBClock.sizes[0];

    const p = (!progress || progress < 0) ? 0 : progress < this._size ? progress : this._size;
    this._progress = p || 0;

    this._theme = theme || BoBClock.themes[0];
  }

  get theme () {
    return this._theme;
  }

  get size () {
    return this._size;
  }

  get progress () {
    return this._progress;
  }

  get image () {
    return {
      img: `systems/band-of-blades/themes/${this.theme}/${this.size}clock_${this.progress}.svg`,
      widthTile: 200,
      heightTile: 200,
	    widthSheet: 350,
	    heightSheet: 350
    };
  }

  get flags () {
    return {
      "band-of-blades": {
	    clocks: {
          theme: this._theme,
          size: this._size,
          progress: this._progress
        }
	  }
    };
  }

  cycleSize () {
    return new BoBClock({
      theme: this.theme,
      size: BoBClock.sizes[nextIndexInArray(BoBClock.sizes, this.size)],
      progress: this.progress
    });
  }

  cycleTheme () {
    return new BoBClock({
      theme: BoBClock.themes[nextIndexInArray(BoBClock.themes, this.theme)],
      size: this.size,
      progress: this.progress
    });
  }

  increment () {
    const old = this;
    return new BoBClock({
      theme: old.theme,
      size: old.size,
      progress: old.progress + 1
    });
  }

  decrement () {
    const old = this;
    return new BoBClock({
      theme: old.theme,
      size: old.size,
      progress: old.progress - 1
    });
  }

  isEqual (clock) {
    return clock
      && clock._progress === this._progress
      && clock._size === this._size
      && clock._theme === this._theme;
  }

  toString () {
    return `${this._progress}/${this._size} • ${this._theme}`;
  }
}
