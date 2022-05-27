import { BoBHelpers } from "./bob-helpers.js";

/**
 * Extend the basic Item
 * @extends {Item}
 */
export class BoBItem extends Item {

  /** @override */
  async _preCreate( data, options, user ) {
    await super._preCreate( data, options, user );
    // put as many things into preCreate as possible to avoid database semaphore issue that likely won't be corrected until 0.9.x
    let actor = this.parent ? this.parent : null;

    if( ( actor?.documentName === "Actor" ) && ( user.id === game.user.id ) ) {
      //remove duplicates for some item types
      const removeDupeItems = BoBHelpers.removeDuplicatedItemType( data, actor );
      if( removeDupeItems.length !== 0 ) {
        for await( let item of removeDupeItems ) {
          item = actor.items.get( item );
          await item.delete();
        }
      }

      if( ( ( data.type === "class" ) || ( data.type === "role" ) || ( data.type === "chosen" ) ) && ( data.data.def_abilities !== "" ) ) {
        await BoBHelpers.addDefaultAbilities( data, actor );
      }

      if( ( data.type === "class" ) || ( data.type === "role" ) ) {
        let update = { _id: actor.id };
        // set actor icon for new class, if icon is already class icon or mystery man to avoid resetting custom art
        if( ( actor.img.slice( 0, 43 ) === "systems/band-of-blades/styles/assets/icons/" ) || ( actor.img === "icons/svg/mystery-man.svg" ) ) {
          const icon = data.img;
          foundry.utils.mergeObject(
            update,
            {
              img: icon,
              "token.img": icon
            }
          );
        }

        if( data.type === "class" ) {

          // adds specialist skill, if character has specialist class (non-Rookie)
          const skill = data.data.skill;
          const skillData = actor.data.data.attributes;

          if( skill ) {
            const value = parseInt( skillData.specialist.skills[skill].value ) > 1 ? skillData.specialist.skills[skill].value : "1";
            const max = parseInt( skillData.specialist.skills[skill].max ) > 3 ? skillData.specialist.skills[skill].max : 3;
            foundry.utils.mergeObject(
              update,
              { data: { attributes: { specialist: { skills: { [skill]: { value: value, max: max } } } } } }
            );
          }

          //remove all load items on class change
          const removeLoadItems = BoBHelpers.getActorItemsByType( actor.id, "item" );
          if( removeLoadItems.length !== 0 ) {
            for await( let item of removeLoadItems ) {
              item = actor.items.get( item );
              await item.delete();
            }
          }
        }

        await Actor.updateDocuments( [ update ] );
      }
    }
  }

  /* -------------------------------------------- */

  /** @override */
  async _onCreate( data, options, userId ) {
    super._onCreate( data, options, userId );
    let actor = this.parent ? this.parent : null;

    // Create actor flags for consumable uses dropdowns on sheet, in OnCreate because id is not set until after preCreate
    if( actor && actor.data ) {
      let key = data._id;
      if( data.data.itemType === "Mercy" ) {
        await actor.setFlag( "band-of-blades", "items." + key + ".wounded", false );
      } else if( data.type === "spies" ) {
        await actor.setFlag( "band-of-blades", "items." + key + ".wounded", false );
        await actor.setFlag( "band-of-blades", "items." + key + ".master", data.data.master );
      } else if( parseInt( data.data.uses ) ) {
        let itemVal = parseInt( data.data.uses );
        let itemArray = {};
        if( itemVal ) {
          for( let i = 0; i <= itemVal; i++ ) {
            foundry.utils.mergeObject(
              itemArray,
              { [i]: String(i) }
            );
          }
          await actor.setFlag( "band-of-blades", "items." + key + ".usagesArray", itemArray );
        }
        if( data.data.itemType === "Alchemist" ) {
          await actor.setFlag( "band-of-blades", "items." + key + ".usages", "0" );
        } else {
          await actor.setFlag( "band-of-blades", "items." + key + ".usages", data.data.uses );
        }
        await actor.setFlag( "band-of-blades", "items." + key + ".usagesMax", data.data.uses );
      }
    }
  }

  /* -------------------------------------------- */

  /** @override */
  async _onDelete( options, userId ) {
    if( userId === game.user.id ) {
      const actor = this.parent ? this.parent : null;
      const actorData = actor?.data;
      const data = this.data;

      // Delete related flags on item delete
      if ( actor !== null ) {
        let itemFlag = actor?.getFlag( "band-of-blades", "items." + this.data._id ) || {};
        if( itemFlag ) {
          let deleted = await actor?.unsetFlag( "band-of-blades", "items." + this.data._id );
        }
      }
    }
    super._onDelete( options, userId );
  }

  /* -------------------------------------------- */

  /** @override */
  prepareData() {
    super.prepareData();

    const item_data = this.data;
    const data = item_data.data;


  };

  async sendToChat() {
    const itemData = this.data.toObject();
    if (itemData.img.includes("/mystery-man")) {
      itemData.img = null;
    }
    const html = await renderTemplate("systems/band-of-blades/templates/items/chat-item.html", itemData);
    const chatData = {
      user: game.userId,
      content: html,
    };
    const message = await ChatMessage.create(chatData);
  }
}
