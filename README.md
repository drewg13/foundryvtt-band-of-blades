FoundryVTT Band of Blades

An attempt to adapt the Blades in the Dark system created by megastruktur to Band of Blades
IMPORTANT NOTES

You DO NOT need to import any items out of the compendiums in order to use them. Currently, if you do import them, the system should ignore the compendium version on the assumption that you imported the item in order to edit it.
Recommended Modules

    Forien's Easy Polls (for helping players make a final decision)
    Tabletop RPG Music

Usage

"Actor" - characters, clocks

"Item" - classes, items, abilities, heritages, traits

    Start out by creating a character which will be assigned the Rookie class by default.  Change the class, if needed.
    To add items, you can click a corresponding label to bring up a popup containing all eligible items.
    All class-specific items are prefixed with letters representing the load level at which they are available, but item 
    lists on the character sheet should be correctly limited to the appropriate items.
    If you want/need to add an item that does not appear in the popup list (for example, adding a Veteran ability), just 
    drag and drop it from the proper compendium.
    To see the description of classes, heritages, etc., you can just click added item and see all the info in the popup.
    When adding a new item you can hover over a "question-circle" icon to see the item's description.
    To add custom abilities, items, etc., just add a new "Foundry Item" of the corresponding type and fill all the necessary 
    info. Then drag it to the sheet or add via button on a sheet.
    BE CAREFUL removing items. Any item removed from an actor sheet will lose all linked data and will have to be recreated.

Classes:

    Rookie
    Soldier
    Heavy
    Medic
    Officer
    Scout
    Sniper


Screenshots

![image](./images/BoB.gif)

![image](./images/Items.gif)


Clocks

(thanks to TyrannosaurusRoy for permission to use the UI code from his great Clocks module!)

Clock Actors

    Clock Actors live in your Actors tab (and can be dragged onto a scene as a token). To get started, create a new actor and select the clock actor type. Change a clock setting (such as theme or size) or hit the Reset button (between the plus/minus buttons) to generate the correct clock artwork, if it doesn't appear as expected. Note that you can right-click Clock tokens for some of the same UI buttons from Clock Tiles for modifying the clock which will carry over to the linked actor. Multiple clock tokens linked to the same actor should stay in sync within the same scene, but tokens in different scenes will have to have the sheet opened to sync up.

Clock Tiles

    Clock Tiles are useful for quick, disposable clocks you'd like to drop onto the scene but don't plan to keep around for long. Click the new Clock button in the Tiles toolbar and a new clock will be dropped into the actual middle of your scene (you may need to scroll to see it). When you select and right-click the clock you'll see a new set of controls on the left that let you switch the clock's theme, cycle through clock sizes, and increment/decrement progress on the clock.
Logic field

    Logic field is a json with params which allows to implement some logic when the Item of corresponding type is added or removed.
    Example (from the Vault 1 crew upgrade)

    {"attribute":"data.vault.max","operator":"addition","value":4,"requirement":""}

    attribute - the attribute to affect
    operator - what is done to attribute
    value - the value for operator
    requirement - is not used

Operators list

    addition - is added when item is attached and substracted when removed
    attribute_change - changes the "attribute" to value and when removed - uses the "attribute_default" to restore

Troubleshooting

    If you can't find an item added to your sheet, refer to "All Items" tab on each sheet.

Credits

    Initial system forked from megastruktur's Blades in the Dark
    Clock UI is adapted from the Clocks module by TyrannosaurusRoy (troygoode) under the MIT license
    This work is based on Band of Blades (http://offguardgames.com/band-of-blades/), a product of Off Guard Games (https://offguardgames.com/) and designed by John LeBoeuf-Little and Stras Acimovic (expressly approved by Stras).
    Band of Blades is based on Blades in the Dark (found at http://www.bladesinthedark.com/), product of One Seven Design, developed and authored by John Harper, and licensed for use under the Creative Commons Attribution 3.0 Unported license (http://creativecommons.org/licenses/by/3.0/).
    Some assets were taken/adapted from here (thank you to timdenee and joesinghaus): https://github.com/joesinghaus/Blades-in-the-Dark
