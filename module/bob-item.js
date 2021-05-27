 /**
 * Extend the basic Item
 * @extends {Item}
 */
export class BoBItem extends Item {

  /** @override */
  async _onCreate(data, options, user) {
    super._onCreate( data, options, user );

    if( parseInt( data.data.uses ) ) {
      let key = data._id;
      let itemVal = parseInt( data.data.uses );
      let itemArray = "";
      if( itemVal ) {
        for( let i = 0; i <= itemVal; i++ ) {
          itemArray = itemArray + i;
        }
        await this.parent.setFlag( "band-of-blades", "items." + key + ".usesarray", itemArray );
        itemVal = 0;
        itemArray = "";
      }
      await this.parent.setFlag( "band-of-blades", "items." + key + ".uses", data.data.uses );
      await this.parent.setFlag( "band-of-blades", "items." + key + ".usesmax", data.data.uses );
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
