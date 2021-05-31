import { BoBHelpers } from "./bob-helpers.js";

/**
 * Extend the basic Item
 * @extends {Item}
 */
export class BoBItem extends Item {

  /** @override */
  async _preCreate( data, options, user ) {
    await super._preCreate( data, options, user );

    let removeItems = [];
    let actor = this.parent ? this.parent : null;

    //remove duplicates for some item types
    if( user.id === game.user.id ) {
      if( actor?.documentName === "Actor" ) {
        removeItems = BoBHelpers.removeDuplicatedItemType( data, actor );
      }
      if( removeItems.length !== 0 ) {
        await actor.deleteEmbeddedDocuments( "Item", removeItems );
      }
    }

    //remove all load items on class change
    if( user.id === game.user.id ) {
      if( data.type === "class" ) {
        removeItems = await BoBHelpers.getActorItemsByType( actor.id, "item" );
      }
      if( removeItems.length !== 0 ) {
        await actor.deleteEmbeddedDocuments( "Item", removeItems );
      }
    }
  }

  /* -------------------------------------------- */

  /** @override */
  async _onCreate( data, options, userId ) {
    super._onCreate( data, options, userId );

    if( userId === game.user.id ) {
      let actor = this.parent ? this.parent : null;

      if( ( actor?.documentName === "Actor" ) && ( actor?.permission >= CONST.ENTITY_PERMISSIONS.OWNER ) ) {
        await BoBHelpers.callItemLogic( data, actor );

        if( ( data.type === "class" ) && ( data.data.def_abilities !== "" ) ) {
          await BoBHelpers.addDefaultAbilities( data, actor );
        }

        if( ( data.type === "class" ) && ( ( actor.img.slice( 0, 43 ) === "systems/band-of-blades/styles/assets/icons/" ) || ( actor.img === "icons/svg/mystery-man.svg" ) ) ) {
          const icon = data.img;
          const icon_update = {
            img: icon,
            token: {
              img: icon
            }
          };
          await actor.update( icon_update );
        }
      }

      // Create actor flags for consumable uses dropdowns on sheet
      if( ( actor !== null ) && parseInt( data.data.uses ) ) {
        let key = data._id;
        let itemVal = parseInt( data.data.uses );
        let itemArray = "";
        if( itemVal ) {
          for( let i = 0; i <= itemVal; i++ ) {
            itemArray = itemArray + i;
          }
          await actor.setFlag( "band-of-blades", "items." + key + ".usesArray", itemArray );
        }
        await actor.setFlag( "band-of-blades", "items." + key + ".uses", data.data.uses );
        await actor.setFlag( "band-of-blades", "items." + key + ".usesMax", data.data.uses );
      }
    }
  }

  /* -------------------------------------------- */

  /** @override */
  async _onDelete( options, userId ) {
    super._onDelete( options, userId );

    let actor = this.parent ? this.parent : null;
    let data = this.data;
    if ( ( actor?.documentName === "Actor" ) && ( actor?.permission >= CONST.ENTITY_PERMISSIONS.OWNER ) ) {
      await BoBHelpers.undoItemLogic( data, actor );
    }

    // Delete related flags on item delete
    if ( actor !== null ) {
      let itemFlag = actor?.getFlag( "band-of-blades", "items." + this.data._id ) || {};
      if( itemFlag ) {
        const key = "flags.band-of-blades.items.-=" + this.data._id;
        await actor.data.update( { [key]: null } )
      }
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
