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
    const updateData = {};
    switch ( createData.type ) {
      case "character": {
        updateData['token.actorLink'] = true;
        updateData['token.name'] = createData.name;
        updateData['token.displayName'] = 50;
        break;
      }
      case "\uD83D\uDD5B clock": {
        updateData['img'] = "systems/band-of-blades/themes/black/4clock_0.svg";
        updateData['token.actorLink'] = true;
        updateData['token.name'] = createData.name;
        updateData['token.displayName'] = 50;
        break;
      }
    }
    await this.data.update(updateData);
  }

  /* -------------------------------------------- */

  /** @override */
  async _onCreate( data, options, userId ) {
    super._onCreate( data, options, userId );

    if( userId === game.user.id ) {

      // add default class to new character
      const defaultClassName = "Rookie";
      let classes = await BoBHelpers.getAllItemsByType( "class", game );
      let itemData = classes.find( c => c.name === defaultClassName ) || {};
      if( this.permission >= CONST.ENTITY_PERMISSIONS.OWNER ) {
        await this.createEmbeddedDocuments( "Item", [ itemData ] );
      }

    }
  }

  /* -------------------------------------------- */

  /** @override */
  prepareDerivedData() {
    const actorData = this.data;
    const data = actorData.data;

    if ( actorData.type === "ship" ) {
      // calculates upkeep value from (crew quality + engine quality + hull quality + comms quality + weapons quality) / 4, rounded down
      data.systems.upkeep.value = Math.floor((parseInt(data.systems.crew.value) + parseInt(data.systems.engines.value) + parseInt(data.systems.hull.value) + parseInt(data.systems.comms.value) + parseInt(data.systems.weapons.value)) / 4);
    }

    if ( actorData.type === "character" ) {
      //sets up array of values for specialist skill uses tracking dropdown
      const spec_skills = Object.keys( game.system.model.Actor.character.attributes.specialist.skills );
      let skillArray = "";
      let skillVal = 0;
      spec_skills.forEach( s => {
        data.attributes.specialist.skills[s].usesArray = "0";
        skillVal = data.attributes.specialist.skills[s].value;
        if( skillVal ) {
          for( let i = skillVal; i >= 0; i-- ) {
            skillArray = skillArray + i;
          }
          data.attributes.specialist.skills[s].usesArray = skillArray;
          skillVal = 0;
          skillArray = "";
        }
      })
    }
  }


  /** @override */
  getRollData() {
    const data = super.getRollData();
    const attributes = Object.keys( game.system.model.Actor.character.attributes );
    if( attributes[attributes.length - 1] === "specialist" ) { attributes.pop(); }
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
