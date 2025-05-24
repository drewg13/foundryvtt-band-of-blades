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
    if( createData.img || createData.token ){ return }
    // add token default settings
    const theme = game.system.bobclocks.themes[ game.settings.get( "band-of-blades", "defaultClockTheme" ) ];
    const updateData = {};
    createData.prototypeToken = createData.prototypeToken || {};
    switch ( createData.type ) {
      case "character": {
        updateData['img'] = "systems/band-of-blades/styles/assets/icons/rookie.svg";
        updateData['prototypeToken.texture'] = createData.prototypeToken.texture || {};
        updateData['prototypeToken.texture.src'] = createData.prototypeToken.texture?.src || "systems/band-of-blades/styles/assets/icons/rookie.svg";
        updateData['system.trauma.list'] = game.system.traumaList.reduce( ( key, val ) => ( key[val]=false, key ), {} );
        updateData['system.blight.list'] = game.system.blightList.reduce( ( key, val ) => ( key[val]=false, key ), {} );
        updateData['prototypeToken.actorLink'] = true;
        updateData['prototypeToken.name'] = createData.name;
        updateData['prototypeToken.displayName'] = 50;
        const playbookXP = game.settings.get( "band-of-blades", "defaultPlaybookXPBarSize" );
        const attributeXP = game.settings.get( "band-of-blades", "defaultAttributeXPBarSize" );

        if( playbookXP ) {
          updateData['system.experienceMax'] = playbookXP;
        }
        if( attributeXP ) {
          const attributes = Object.keys( game.model.Actor.character.attributes );
          attributes.forEach( a => updateData['system.attributes.'+ a + '.expMax'] = attributeXP );
        }
        break;
      }
      case "role": {
        updateData['img'] = "systems/band-of-blades/styles/assets/icons/role.svg";
        updateData['prototypeToken.texture'] = createData.prototypeToken.texture || {};
        updateData['prototypeToken.texture.src'] = createData.prototypeToken.texture?.src || "systems/band-of-blades/styles/assets/icons/role.svg";
        updateData['prototypeToken.actorLink'] = true;
        updateData['prototypeToken.name'] = createData.name;
        updateData['prototypeToken.displayName'] = 50;
        break;
      }
      case "chosen": {
        updateData['img'] = "systems/band-of-blades/styles/assets/icons/chosen.svg";
        updateData['prototypeToken.texture'] = createData.prototypeToken.texture || {};
        updateData['prototypeToken.texture.src'] = createData.prototypeToken.texture?.src || "systems/band-of-blades/styles/assets/icons/chosen.svg";
        updateData['prototypeToken.actorLink'] = true;
        updateData['prototypeToken.name'] = createData.name;
        updateData['prototypeToken.displayName'] = 50;
        break;
      }
      case "minion": {
        updateData['img'] = "systems/band-of-blades/styles/assets/icons/minion.svg";
        updateData['prototypeToken.texture'] = createData.prototypeToken.texture || {};
        updateData['prototypeToken.texture.src'] = createData.prototypeToken.texture?.src || "systems/band-of-blades/styles/assets/icons/minion.svg";
        updateData['prototypeToken.actorLink'] = true;
        updateData['prototypeToken.name'] = createData.name;
        updateData['prototypeToken.displayName'] = 50;
        break;
      }
      case "\uD83D\uDD5B clock": {
        updateData['img'] = "systems/band-of-blades/themes/" + theme + "/4clock_0.svg";
        updateData['prototypeToken.texture'] = createData.prototypeToken.texture || {};
        updateData['prototypeToken.texture.src'] = createData.prototypeToken.texture?.src || "systems/band-of-blades/themes/" + theme + "/4clock_0.svg";
        updateData['prototypeToken.actorLink'] = true;
        updateData['prototypeToken.name'] = createData.name;
        updateData['prototypeToken.displayName'] = 50;
        break;
      }
    }
    await this.updateSource( updateData );

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

    if (this.type === "minion") {
      if( !this.system.hpClock.value ){ this.system.hpClock.value = 0 }
      if( this.system.hpClock.type === 0 ){ this.system.hpClock.type = 4 }
      this.system.size_list = BoBHelpers.createListOfClockSizes( game.system.bobclocks.sizes, this.system.hpClock.type, parseInt( this.system.hpClock.type ) );
    }

    if ( this.type === "role" && this.system.type === "Quartermaster" ) {
      this.system.size_list = {};
      this.system.color_list = {};
      for( let i = 1; i <= 6; i++ ) {
        let clock = "clock" + i.toString();
        this.system.size_list[clock] = BoBHelpers.createListOfClockSizes( game.system.bobclocks.sizes, this.system.resources.projects[clock].type, parseInt( this.system.resources.projects[clock].type ) );
        this.system.color_list[clock] = BoBHelpers.createListOfClockColors( game.system.bobclocks.themes, this.system.resources.projects[clock].color, this.system.resources.projects[clock].color );
      }
    }
  }

  /* -------------------------------------------- */

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    if( ( this.type === "role" ) && ( this.system.resources.supply.extraUses > 0 ) ) {
      let foodItems = [];
      this.items.forEach( i => {
        if( i.system.itemType === "Food Stores" ) {
          foodItems.push( i.id );
        }
      })
      foodItems.forEach( f => {
        if( this.flags['band-of-blades'].items[f] ) {
          const increase = this.system.resources.supply.extraUses;
          this.flags['band-of-blades'].items[f].usagesMax = String( parseInt( this.flags['band-of-blades'].items[f].usagesMax ) + increase );
          for( let i = ( Math.max( ...Object.keys( this.flags['band-of-blades'].items[f].usagesArray ).map( n => Number(n) ) ) + 1 ); i < ( parseInt( this.flags['band-of-blades'].items[f].usagesMax ) + 1 ); i++ ) {
            foundry.utils.mergeObject(
              this.flags['band-of-blades'].items[f].usagesArray,
              { [i]: String( i ) }
            )
          }
        }
      })
    }

    if ( this.type === "character" ) {
      //sets up array of values for specialist skill uses tracking dropdown
      const spec_skills = Object.keys( game.model.Actor.character.attributes.specialist.skills );
      let skillArray = {};
      let skillVal = 0;
      spec_skills.forEach( s => {
        this.system.attributes.specialist.skills[s].usagesArray = {};
        skillVal = this.system.attributes.specialist.skills[s].value;
        if( skillVal ) {
          for( let i = skillVal; i >= 0; i-- ) {
            foundry.utils.mergeObject(
              skillArray,
              { [i]: String(i) }
            );
          }
          this.system.attributes.specialist.skills[s].usagesArray = skillArray;
          skillVal = 0;
          skillArray = {};
        }
      })
      let traumaCount = 0;
      Object.keys( this.system.trauma.list ).forEach( t => {
        if( this.system.trauma.list[t] ){ traumaCount++ }
      })
      this.system.trauma.value = traumaCount;

      let blightCount = 0;
      Object.keys( this.system.blight.list ).forEach( b => {
        if( this.system.blight.list[b] ){ blightCount++ }
      })
      this.system.blight.value = blightCount;

    }
  }


  /** @override */
  getRollData() {
    const rollData = super.getRollData();

    rollData.dice_amount = this.getAttributeDiceToThrow();

    return rollData;
  }

  /* -------------------------------------------- */
  /**
   * Calculate Attribute Dice to throw.
   */
  getAttributeDiceToThrow() {

    // Calculate Dice to throw.
    let dice_amount = {};

	  switch (this.type) {
	    case 'character':
	      for (const a in this.system.attributes) {
          dice_amount[a] = {
            "value": 0,
            "bonus": 0
          };

          for( const s in this.system.attributes[a].skills ) {
            dice_amount[s] = {
              "value": parseInt( this.system.attributes[a].skills[s]['value'][0] ),
              "bonus": 0
            }

            // We add a +1d for every skill higher than 0.
            if( dice_amount[s].value > 0 ) {
              dice_amount[a].value++;
            }

            // add resistance bonus dice
            if( this.system.attributes[a].bonus ) {
              dice_amount[a].bonus = this.system.attributes[a].bonus;
            }
          }
        }
        // add specialist action to insight resistance dice
        if( parseInt( this.system.attributes.specialist.skills[this.system.item_triggers.spec_skill]?.value ) > 0 ) {
          dice_amount.insight.value++;
        }
	      break;
      case 'role':
        dice_amount.pressure = {
          "value": this.system.resources.pressure,
          "bonus": 0
        };
        dice_amount.engagement = {
          "value": this.system.resources.engagement,
          "bonus": 0
        };
        dice_amount.alchemists = {
          "value": this.items.filter( a => a.name === "Alchemist" ).length,
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

    let dropdowns = game.settings.get("band-of-blades", "useDropdownsInRollDialog");

    if( dropdowns ){
      new Dialog({
        title: `${game.i18n.localize('BITD.Roll')} ${game.i18n.localize(attribute_label)}`,
        content: `
        <div class="band-of-blades" id="skill-roll">
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
                <option value="zero">${game.i18n.localize('BITD.EffectZero')}</option>
                <option value="limited">${game.i18n.localize('BITD.EffectLimited')}</option>
                <option value="standard" selected>${game.i18n.localize('BITD.EffectStandard')}</option>
                <option value="great">${game.i18n.localize('BITD.EffectGreat')}</option>
                <option value="extreme">${game.i18n.localize('BITD.EffectExtreme')}</option>
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
            label: game.i18n.localize('BITD.Cancel'),
          },
        },
        default: "yes",
        render: html => {
          $("#skill-roll #mod").on( "change", this._onDiceModChange);
        }
      }).render(true);
    } else {
      new Dialog( {
        title: `${ game.i18n.localize( 'BITD.Roll' ) } ${ game.i18n.localize( attribute_label ) }`,
        content: `
        <div class="band-of-blades" id="skill-roll">
		      <h2>${ game.i18n.localize( 'BITD.Roll' ) } ${ game.i18n.localize( attribute_label ) } (${ total_dice }d)</h2>
          <form>
            <div class="form-group roll position">
              <label>${ game.i18n.localize( 'BITD.Position' ) }:</label>
              <div class="rollRadio" id="pos">
                <input type="radio" id="controlled" name="pos" value="controlled" />
                <label for="controlled">${ game.i18n.localize( 'BITD.PositionControlled' ) }</label>
                <input type="radio" id="risky" name="pos" value="risky" checked/>
                <label for="risky">${ game.i18n.localize( 'BITD.PositionRisky' ) }</label>
                <input type="radio" id="desperate" name="pos" value="desperate" />
                <label for="desperate">${ game.i18n.localize( 'BITD.PositionDesperate' ) }</label>
              </div>
            </div>
            <hr>
            <div class="form-group roll effect">
              <label>${ game.i18n.localize( 'BITD.Effect' ) }:</label>
              <div class="rollRadio" id="fx">
                <input type="radio" id="zero" name="fx" value="zero" />
                <label for="zero">${ game.i18n.localize( 'BITD.EffectZero' ) }</label>
                <input type="radio" id="limited" name="fx" value="limited" />
                <label for="limited">${ game.i18n.localize( 'BITD.EffectLimited' ) }</label>
                <input type="radio" id="standard" name="fx" value="standard" checked/>
                <label for="standard">${ game.i18n.localize( 'BITD.EffectStandard' ) }</label>
                <input type="radio" id="great" name="fx" value="great" />
                <label for="great">${ game.i18n.localize( 'BITD.EffectGreat' ) }</label>
                <input type="radio" id="extreme" name="fx" value="extreme" />
                <label for="extreme">${ game.i18n.localize( 'BITD.EffectExtreme' ) }</label>
              </div>
            </div>
            <hr>
            <div class="form-group roll base-dice">
              <label class="base-dice">${ game.i18n.localize( 'BITD.BaseDice' ) }: </label>
			        <label>${ base_dice }d</label>
            </div>
            <div class="form-group roll bonus-dice">
              <label class="bonus-dice">${ game.i18n.localize( 'BITD.BonusDice' ) }: </label>
			        <label>${ bonus_dice }d</label>
            </div>
            <div class="form-group roll mod">
              <label>${ game.i18n.localize( 'BITD.Modifier' ) }:</label>
              <select id="mod" name="mod" data-base-dice="${ base_dice }">
                ${ this.createListOfDiceMods( -3, +3, 0 ) }
              </select>
            </div>
		        <div class="form-group roll total-rolled">
              <label class="total-rolled">${ game.i18n.localize( 'BITD.TotalDice' ) }: </label>
			        <label>${ total_dice }d</label>
            </div>
            <hr>
          </form>
		      <h2>${ game.i18n.localize( 'BITD.RollOptions' ) }</h2>
		      <div class="action-info">${ game.i18n.localize( 'BITD.ActionsHelp' ) }</div>
        </div>
      `,
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: game.i18n.localize( 'BITD.Roll' ),
            callback: async( html ) => {
              let modifier = parseInt( html.find( '[name="mod"]' )[0].value );
              let position = html.find( 'input:radio[name="pos"]:checked' )[0].value;
              let effect = html.find( 'input:radio[name="fx"]:checked' )[0].value;
              await this.rollAttribute( attribute_name, modifier, position, effect );
            }
          },
          no: {
            icon: "<i class='fas fa-times'></i>",
            label: game.i18n.localize( 'BITD.Cancel' ),
          },
        },
        default: "yes",
        render: html => {
          $( "#skill-roll #mod" ).on( "change", this._onDiceModChange );
        }
      } ).render( true );
    }
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
        <div class="band-of-blades" id="skill-roll">
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
          label: game.i18n.localize('BITD.Cancel'),
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
    let speaker_name = this.name;
    const attributes = Object.keys( game.model.Actor.character.attributes );
    if( attributes[attributes.length - 1] === "specialist" ) { attributes.pop(); }
    if ( attribute_name !== "" ) {
      let rollData = this.getRollData();
      dice_amount += rollData.dice_amount[attribute_name].value;
      dice_amount += rollData.dice_amount[attribute_name].bonus;
    }
    else {
      dice_amount = 1;
    }
    dice_amount += additional_dice_amount;

    await bobRoll( dice_amount, attribute_name, position, effect, "", speaker_name );
  }

  /* -------------------------------------------- */

  /**
   * Create <options> for available actions
   *  which can be performed.
   */
  createListOfActions() {

    let text = '';
    let attributes, attribute, skill;
    attributes = this.system.attributes;

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

  async sendObjectToChat() {

    const html = await foundry.applications.handlebars.renderTemplate("systems/band-of-blades/templates/items/chat-item.html", this);
    const chatData = {
      user: game.userId,
      content: html,
    };
    const message = await ChatMessage.create(chatData);
  }
}
