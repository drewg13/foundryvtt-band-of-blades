import { bobRoll } from "./bob-roll.js";
import { BoBHelpers } from "./bob-helpers.js";

/**
 * Extend the basic Actor
 * @extends {Actor}
 */
export class BoBActor extends Actor {

  /** @override */
  async _preCreate(createData, options, user) {
    await super._preCreate(createData, options, user);

    // add token default settings
    const theme = game.system.bobclocks.themes[ game.settings.get( "band-of-blades", "defaultClockTheme" ) ];
    const updateData = {};
    switch ( createData.type ) {
      case "character": {
        updateData['img'] = "systems/band-of-blades/styles/assets/icons/rookie.svg";
        updateData['token.img'] = "systems/band-of-blades/styles/assets/icons/rookie.svg";
        updateData['data.trauma.list'] = game.system.traumaList.reduce( ( key, val ) => ( key[val]=false, key ), {} );
        updateData['data.blight.list'] = game.system.blightList.reduce( ( key, val ) => ( key[val]=false, key ), {} );
        updateData['token.actorLink'] = true;
        updateData['token.name'] = createData.name;
        updateData['token.displayName'] = 50;
        break;
      }
      case "role": {
        updateData['img'] = "systems/band-of-blades/styles/assets/icons/role.svg";
        updateData['token.img'] = "systems/band-of-blades/styles/assets/icons/role.svg";
        updateData['token.actorLink'] = true;
        updateData['token.name'] = createData.name;
        updateData['token.displayName'] = 50;
        break;
      }
      case "chosen": {
        updateData['img'] = "systems/band-of-blades/styles/assets/icons/chosen.svg";
        updateData['token.img'] = "systems/band-of-blades/styles/assets/icons/chosen.svg";
        updateData['token.actorLink'] = true;
        updateData['token.name'] = createData.name;
        updateData['token.displayName'] = 50;
        break;
      }
      case "minion": {
        updateData['img'] = "systems/band-of-blades/styles/assets/icons/minion.svg";
        updateData['token.img'] = "systems/band-of-blades/styles/assets/icons/minion.svg";
        updateData['token.actorLink'] = true;
        updateData['token.name'] = createData.name;
        updateData['token.displayName'] = 50;
        break;
      }
      case "\uD83D\uDD5B clock": {
        updateData['img'] = "systems/band-of-blades/themes/" + theme + "/4clock_0.svg";
        updateData['token.img'] = "systems/band-of-blades/themes/" + theme + "/4clock_0.svg";
        updateData['token.actorLink'] = true;
        updateData['token.name'] = createData.name;
        updateData['token.displayName'] = 50;
        break;
      }
    }
    await this.data.update( updateData );

  }

  /* -------------------------------------------- */

  /** @override */
  async _onCreate( data, options, userId ) {
    super._onCreate( data, options, userId );

  }

  /* -------------------------------------------- */

  /** @override */
  prepareData() {
    super.prepareData();

    const actorData = this.data;
    const data = actorData.data;

    if (actorData.type === "minion") {
      if( !data.hpClock.value ){ data.hpClock.value = 0 }
      if( data.hpClock.type === 0 ){ data.hpClock.type = 4 }
      data.size_list = BoBHelpers.createListOfClockSizes( game.system.bobclocks.sizes, data.hpClock.type, parseInt( data.hpClock.type ) );
    }
  }

  /* -------------------------------------------- */

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    const actorData = this.data;
    const data = actorData.data;

    if( ( actorData.type === "role" ) && ( data.resources.supply.extraUses > 0 ) ) {
      let foodItems = [];
      actorData.items.forEach( i => {
        if( i.data.data.itemType === "Food Stores" ) {
          foodItems.push( i.id );
        }
      })
      foodItems.forEach( f => {
        if( actorData.flags['band-of-blades'].items[f] ) {
          const increase = data.resources.supply.extraUses;
          actorData.flags['band-of-blades'].items[f].usagesMax = String( parseInt( actorData.flags['band-of-blades'].items[f].usagesMax ) + increase );
          for( let i = ( Math.max( ...Object.keys( actorData.flags['band-of-blades'].items[f].usagesArray ).map( n => Number(n) ) ) + 1 ); i < ( parseInt( actorData.flags['band-of-blades'].items[f].usagesMax ) + 1 ); i++ ) {
            foundry.utils.mergeObject(
              actorData.flags['band-of-blades'].items[f].usagesArray,
              { [i]: String( i ) }
            )
          }
        }
      })
    }

    if ( actorData.type === "character" ) {
      //sets up array of values for specialist skill uses tracking dropdown
      const spec_skills = Object.keys( game.system.model.Actor.character.attributes.specialist.skills );
      let skillArray = {};
      let skillVal = 0;
      spec_skills.forEach( s => {
        data.attributes.specialist.skills[s].usagesArray = {};
        skillVal = data.attributes.specialist.skills[s].value;
        if( skillVal ) {
          for( let i = skillVal; i >= 0; i-- ) {
            foundry.utils.mergeObject(
              skillArray,
              { [i]: String(i) }
            );
          }
          data.attributes.specialist.skills[s].usagesArray = skillArray;
          skillVal = 0;
          skillArray = {};
        }
      })
    }
  }


  /** @override */
  getRollData() {
    const data = super.getRollData();

    data.dice_amount = this.getAttributeDiceToThrow();

    return data;
  }

  /* -------------------------------------------- */
  /**
   * Calculate Attribute Dice to throw.
   */
  getAttributeDiceToThrow() {

    // Calculate Dice to throw.
    let dice_amount = {};

	  switch (this.data.type) {
	    case 'character':
	      for (const a in this.data.data.attributes) {
          dice_amount[a] = {
            "value": 0,
            "bonus": 0
          };

          for( const s in this.data.data.attributes[a].skills ) {
            dice_amount[s] = {
              "value": parseInt( this.data.data.attributes[a].skills[s]['value'][0] ),
              "bonus": 0
            }

            // We add a +1d for every skill higher than 0.
            if( dice_amount[s].value > 0 ) {
              dice_amount[a].value++;
            }

            // add resistance bonus dice
            if( this.data.data.attributes[a].bonus ) {
              dice_amount[a].bonus = this.data.data.attributes[a].bonus;
            }
          }
        }
        // add specialist action to insight resistance dice
        if( this.data.data.item_triggers.specialist ) {
          dice_amount.insight.value++;
        }
	      break;
      case 'role':
        dice_amount.pressure = {
          "value": this.data.data.resources.pressure,
          "bonus": 0
        };
        dice_amount.engagement = {
          "value": this.data.data.resources.engagement,
          "bonus": 0
        };
        dice_amount.alchemists = {
          "value": this.data.items.filter( a => a.name === "Alchemist" ).length,
          "bonus": 0
        };
        dice_amount.mission = {
          "value": 1,
          "bonus": 0
        };

        break;
	  }
    return dice_amount;
  }

  /* -------------------------------------------- */

  rollActionPopup(attribute_name) {

    let attribute_label = BoBHelpers.getAttributeLabel(attribute_name);

    // Calculate Dice Amount for Attributes
    const base_dice = this.getRollData().dice_amount[attribute_name].value;
    const bonus_dice = this.getRollData().dice_amount[attribute_name].bonus;
    let total_dice = base_dice + bonus_dice;

    new Dialog({
      title: `${game.i18n.localize('BITD.Roll')} ${game.i18n.localize(attribute_label)}`,
      content: `
        <div id="skill-roll">
		      <h2>${game.i18n.localize('BITD.Roll')} ${game.i18n.localize(attribute_label)} (${total_dice}d)</h2>
          <form>
            <div class="form-group roll position">
              <label>${game.i18n.localize('BITD.Position')}:</label>
              <select id="pos" name="pos">
                <option value="controlled">${game.i18n.localize('BITD.PositionControlled')}</option>
                <option value="risky" selected>${game.i18n.localize('BITD.PositionRisky')}</option>
                <option value="desperate">${game.i18n.localize('BITD.PositionDesperate')}</option>
              </select>
            </div>
            <div class="form-group roll effect">
              <label>${game.i18n.localize('BITD.Effect')}:</label>
              <select id="fx" name="fx">
                <option value="limited">${game.i18n.localize('BITD.EffectLimited')}</option>
                <option value="standard" selected>${game.i18n.localize('BITD.EffectStandard')}</option>
                <option value="great">${game.i18n.localize('BITD.EffectGreat')}</option>
              </select>
            </div>
            <div class="form-group roll base-dice">
              <label class="base-dice">${game.i18n.localize('BITD.BaseDice')}: </label>
			        <label>${base_dice}d</label>
            </div>
            <div class="form-group roll bonus-dice">
              <label class="bonus-dice">${game.i18n.localize('BITD.BonusDice')}: </label>
			        <label>${bonus_dice}d</label>
            </div>
            <div class="form-group roll mod">
              <label>${game.i18n.localize('BITD.Modifier')}:</label>
              <select id="mod" name="mod" data-base-dice="${base_dice}">
                ${this.createListOfDiceMods(-3,+3,0)}
              </select>
            </div>
		        <div class="form-group roll total-rolled">
              <label class="total-rolled">${game.i18n.localize('BITD.TotalDice')}: </label>
			        <label>${total_dice}d</label>
            </div>
          </form>
		      <h2>${game.i18n.localize('BITD.RollOptions')}</h2>
		      <div class="action-info">${game.i18n.localize('BITD.ActionsHelp')}</div>
        </div>
      `,
      buttons: {
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: game.i18n.localize('BITD.Roll'),
          callback: async (html) => {
            let modifier = parseInt(html.find('[name="mod"]')[0].value);
            let position = html.find('[name="pos"]')[0].value;
            let effect = html.find('[name="fx"]')[0].value;
            await this.rollAttribute(attribute_name, modifier, position, effect);
          }
        },
        no: {
          icon: "<i class='fas fa-times'></i>",
          label: game.i18n.localize('Cancel'),
        },
      },
      default: "yes",
      render: html => {
        $("#skill-roll #mod").on( "change", this._onDiceModChange);
      }
    }).render(true);
  }

  /* -------------------------------------------- */

  rollSimplePopup(attribute_name, roll_type) {

    let attribute_label = BoBHelpers.getAttributeLabel(attribute_name);

    // Calculate Dice Amount for Attributes
    const base_dice = this.getRollData().dice_amount[attribute_name].value;
    const bonus_dice = this.getRollData().dice_amount[attribute_name].bonus;
    let total_dice = base_dice + bonus_dice;

    const proper_attribute_name = BoBHelpers.getProperCase(roll_type);

    new Dialog({
      title: `${game.i18n.localize('BITD.Roll')} ${game.i18n.localize(attribute_label)}`,
      content: `
        <div id="skill-roll">
		      <h2>${game.i18n.localize('BITD.Roll')} ${game.i18n.localize(attribute_label)} (${total_dice}d)</h2>
          <form>
            <div class="form-group roll base-dice">
              <label class="base-dice">${game.i18n.localize('BITD.BaseDice')}: </label>
			        <label>${base_dice}d</label>
            </div>
            <div class="form-group roll bonus-dice">
              <label class="bonus-dice">${game.i18n.localize('BITD.BonusDice')}: </label>
			        <label>${bonus_dice}d</label>
            </div>
            <div class="form-group roll mod">
              <label>${game.i18n.localize('BITD.Modifier')}:</label>
              <select id="mod" name="mod" data-base-dice="${base_dice}">
                ${this.createListOfDiceMods(-3,+3,0)}
              </select>
            </div>
		        <div class="form-group roll total-rolled">
              <label class="total-rolled">${game.i18n.localize('BITD.TotalDice')}: </label>
			        <label>${total_dice}d</label>
            </div>
            <h2>${game.i18n.localize('BITD.RollOptions')}</h2>
		        <div class="action-info">${game.i18n.localize('BITD.' + proper_attribute_name + 'Help')}</div>
          </form>
        </div>
      `,
      buttons: {
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: game.i18n.localize('BITD.Roll'),
          callback: async (html) => {
            let modifier = parseInt(html.find('[name="mod"]')[0].value);
            let position = "";
            let effect = "";
            await this.rollAttribute(attribute_name, modifier, position, effect);
          }
        },
        no: {
          icon: "<i class='fas fa-times'></i>",
          label: game.i18n.localize('Cancel'),
        },
      },
      default: "yes",
      render: html => {
        $("#skill-roll #mod").on( "change", this._onDiceModChange);
      }
    }).render(true);
  }

  /* -------------------------------------------- */

  async rollAttribute( attribute_name = "", additional_dice_amount = 0, position, effect ) {

    let dice_amount = 0;
    const attributes = Object.keys( game.system.model.Actor.character.attributes );
    if( attributes[attributes.length - 1] === "specialist" ) { attributes.pop(); }
    if ( attribute_name !== "" ) {
      let roll_data = this.getRollData();
      dice_amount += roll_data.dice_amount[attribute_name].value;
      dice_amount += roll_data.dice_amount[attribute_name].bonus;
    }
    else {
      dice_amount = 1;
    }
    dice_amount += additional_dice_amount;

    await bobRoll( dice_amount, attribute_name, position, effect );
  }

  /* -------------------------------------------- */

  /**
   * Create <options> for available actions
   *  which can be performed.
   */
  createListOfActions() {

    let text = '';
    let attributes, attribute, skill;
    attributes = this.data.data.data.attributes;

    for ( attribute in attributes ) {

      let skills = attributes[attribute].skills;

      text += `<optgroup label="${attribute} Actions">`;
      text += `<option value="${attribute}">${attribute} (Resist)</option>`;

      for ( skill in skills ) {
        text += `<option value="${skill}">${skill}</option>`;
      }

      text += `</optgroup>`;

    }

    return text;
  }

  /* -------------------------------------------- */

  /**
   * Creates <options> modifiers for dice roll.
   *
   * @param {int} rs
   *  Min die modifier
   * @param {int} re
   *  Max die modifier
   * @param {int} s
   *  Selected die
   */
  createListOfDiceMods( rs, re, s = 0 ) {

    let text = ``;

    for ( let i = rs; i <= re; i++ ) {
      let plus = "";
      if ( i >= 0 ) { plus = "+" }
      text += `<option value="${i}"`;
      if ( i === s ) {
        text += ` selected`;
      }

      text += `>${plus}${i}d</option>`;
    }

    return text;

  }

  /* -------------------------------------------- */
  
  /**
   * Change dice total on display
   * @param {*} event 
   */
  async _onDiceModChange( event ) {
    let mod = this.value;
    let base = this.dataset.baseDice;

    $( "#skill-roll .total-rolled label:nth-child(2)" ).text( parseInt( base ) + parseInt( mod ) + "d" );
  }

}
