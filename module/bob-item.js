 /**
 * Extend the basic Item
 * @extends {Item}
 */
export class BoBItem extends Item {

  /* override */
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
