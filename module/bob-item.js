 /**
 * Extend the basic Item
 * @extends {Item}
 */
export class BoBItem extends Item {

  /** @override */
  async _onCreate( data, options, user ) {
    super._onCreate( data, options, user );

    // Create actor flags for consumable uses dropdowns on sheet
    if( parseInt( data.data.uses ) ) {
      let key = data._id;
      let itemVal = parseInt( data.data.uses );
      let itemArray = "";
      if( itemVal ) {
        for( let i = 0; i <= itemVal; i++ ) {
          itemArray = itemArray + i;
        }
        await this.parent.setFlag( "band-of-blades", "items." + key + ".usesArray", itemArray );
      }
      await this.parent.setFlag( "band-of-blades", "items." + key + ".uses", data.data.uses );
      await this.parent.setFlag( "band-of-blades", "items." + key + ".usesMax", data.data.uses );
    }
  }

  /* -------------------------------------------- */

  /** @override */
  async _onDelete( options, user ) {
    super._onDelete( options, user );

    // Delete related flags on item delete
    let itemFlag = await this.parent.getFlag( "band-of-blades", "items." + this.data._id ) || {};
    if( itemFlag ) {
      const key = "flags.band-of-blades.items.-=" + this.data._id;
      this.parent.data.update({[key]: null})
    }
  }

  /* -------------------------------------------- */

  /** @override */
  prepareData() {
    super.prepareData();

    const item_data = this.data;
    const data = item_data.data;

	  if (item_data.type === "faction") {
      this._prepareStatusDefault( data );
      data.size_list = BoBHelpers.createListOfClockSizes( game.system.bobclocks.sizes, data.goal_clock_max, parseInt( data.goal_clock.max ) );
    }
  };

  _prepareStatusDefault( data ) {

	  let status = data.status.value;

	  if ( this ) {
		  if ( ( status === "0" ) || ( status === 0 ) ) { status = 4; }
		  data.status.value = status;
	  }
  };
}
