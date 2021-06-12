import { BoBHelpers } from "./bob-helpers.js";

/**
 * Extend the basic Item
 * @extends {Item}
 */
export class BoBItem extends Item {

  /** @override */
  async _preCreate( data, options, user ) {

    await super._preCreate( data, options, user );
  }

  /* -------------------------------------------- */

  /** @override */
  async _onCreate( data, options, userId ) {

    if( userId === game.user.id ) {
      let actor = this.parent ? this.parent : null;

      if( ( actor?.documentName === "Actor" ) && ( actor?.permission >= CONST.ENTITY_PERMISSIONS.OWNER ) ) {

        if( ( data.type === "class" ) && ( data.data.def_abilities !== "" ) ) {
          await BoBHelpers.addDefaultAbilities( data, actor );
        }

        if( data.type === "class" ) {

          // adds specialist skill, if character has specialist class (non-Rookie)
          const skill = data.data.skill;
          const skillData = actor.data.data.attributes;
          let update = {_id: actor.id};
          if( skill ) {
            const value = parseInt( skillData.specialist.skills[skill].value ) > 1 ? skillData.specialist.skills[skill].value : "1";
            const max = parseInt( skillData.specialist.skills[skill].max ) > 3 ? skillData.specialist.skills[skill].max : 3;
            foundry.utils.mergeObject(
              update,
              { data: { attributes: { specialist: { skills: { [skill]: { value: value, max: max } } } } } }
            );
          } else if( data.name === "Rookie" ) {
            let attributes = Object.keys(game.system.model.Actor.character.attributes);
            let max;
            // reset attributes and skills to defaults
            attributes.forEach( a => {
              let skills = Object.keys( game.system.model.Actor.character.attributes[a].skills );
              skills.forEach( s => {
                max = (a === "specialist") ? 0 : 3;
                foundry.utils.mergeObject(
                  update,
                  { data: { attributes: { [a]: { skills: { [s]: { value: "0", max: max } } } } } }
                );
            })});

            // set Rookie defaults
            foundry.utils.mergeObject(
              update,
              { data: { attributes: {
                prowess: { skills: {
                  maneuver: { value: "1" },
                  skirmish: { value: "1" }
                } },
                resolve: { skills: {
                  consort: { value : "1" }
                } } } } }
            );
          }

          // set actor icon for new class, if icon is already class icon or mystery man, avoid resetting custom art
          if( ( actor.img.slice( 0, 43 ) === "systems/band-of-blades/styles/assets/icons/" ) || ( actor.img === "icons/svg/mystery-man.svg" ) ) {
            const icon = data.img;
            foundry.utils.mergeObject(
              update,
              {
                img: icon,
                token: {
                  img: icon
                }
              }
            );
          }

          await Actor.updateDocuments([update]);
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

      let removeDupeItems = [];
      let removeLoadItems = [];

      //remove duplicates for some item types
      if( actor?.documentName === "Actor" ) {
        removeDupeItems = BoBHelpers.removeDuplicatedItemType( data, actor );
        if( removeDupeItems.length !== 0 ) {
          for await( let item of removeDupeItems ) {
            item = actor.items.get( item );
            await item.delete();
          }
        }
      }

      //remove all load items on class change
      if( actor && ( data.type === "class" ) ) {
        removeLoadItems = BoBHelpers.getActorItemsByType( actor.id, "item" );
        if( removeLoadItems.length !== 0 ) {
          for await( let item of removeLoadItems ) {
            item = actor.items.get( item );
            await item.delete();
          }
        }
      }
    }
    super._onCreate( data, options, userId );
  }

  /* -------------------------------------------- */

  /** @override */
  async _onDelete( options, userId ) {

    let actor = this.parent ? this.parent : null;
    //let data = this.data;

    // Delete related flags on item delete
    // TODO: this breaks item usage dropdowns as-is, old version broke active effects, maybe fixed in 0.8.7?
    //if ( actor !== null ) {
    //  let itemFlag = actor?.getFlag( "band-of-blades", "items." + this.data._id ) || {};
    //  if( itemFlag ) {
    //    let deleted = await actor?.unsetFlag( "band-of-blades", "items." + this.data._id );
    //    console.log(deleted.data.flags["band-of-blades"].items);
    //  }
    //}
    super._onDelete( options, userId );
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
