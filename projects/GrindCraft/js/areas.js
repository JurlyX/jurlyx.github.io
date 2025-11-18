// Game Info
setGameInfo({
    name: "GrindRune: A New Beggining",                         // The name of your game!
    version: "0.4",                                     // The current version of your game!
    icon: "images/system/blank.png",                    // Link or path to an icon image for your game!
    ID: "GrindRune",                             // Your game's ID! Should be unique for every game!
});

// Resources

addResources({                                          // Function for adding all the resources (items/tools/buildings) that are used in your game!
    dirt: {
        image: "images/dirt.png",
    },
    glock: {
        image: "images/dirt.png",
    },
    stick: {
        image: "images/stick.png",
    },
    planks: {
        image: "images/planks.png",
    },
    door: {
        image: "images/door.png",
    },
    "crafting table": {
        image: "images/craftingTable.png",
    },
    "dirt hut": {
        image: "images/dirtHut.png",
    },
});

// Areas

addArea("c",                                            // Function for adding areas to your game
{
    name: "The Dark World",
    image: "images/areas/cityState.png",
    unlocked: true,
    updateWhileUnactive: true,

    grinds: [
        {
            name: "Also The Dark World",
            unlocked: true,
            auto: ["glock"],                         // List of items that will auto-grind this grind
            background: "images/grinds/overworld.png",
            resources: [
                {
                    id: "stick",
                    time: [ ["glock", 0.0000000000000000000000001, 99999999999999999999999999999999999999999999999], ["", 0.4]],
                    probability: 50,
                },
                {
                    id: "dirt",
                    time: [["glock", 0.0000000000000000000000001, 99999999999999999999999999999999999999999999999], ["", 0.6]],
                    probability: 50,
                },
            ]
        },
    ],

    crafts: [
        {
            name: "stick",
            desc: "Used to craft planks",
            type: "display",
            cost: [["stick", 0]],
        },
        {
            name: "dirt",
            desc: "Used to build a dirt hut",
            type: "display",
            cost: [["dirt", 0]],
        },
        {
            name: "glock",
            desc: "Used to make people your friend.",
            type: "craft",
            cost: [["stick", 1]],
            message: "why is there 19 of them",
        },
        {
            name: "planks",
            desc: "Used to make a crafting table",
            type: "craft",
            cost: [["stick", 2]],
        },
        {
            name: "crafting table",
            desc: "Required to build a dirt hut",
            type: "craft",
            cost: [["planks", 4]],
        },
        {
            name: "door",
            desc: "Required to build a dirt hut",
            type: "craft",
            amount: 3,
            cost: [["planks", 6]],
        },
        {
            name: "dirt hut",
            desc: "Required to beat the game!",
            type: "craft",
            cost: [["stick", 1]],
        },
    ],

    update(diff) {                                      // diff is the time in milliseconds since last time the update function was runned
        
    },
}
);

// Function that will be runned when the website is loaded
function onLoad(oldVersion) {
    // If the game version in the player's save is not the same as the current game version:
    if (oldVersion !== player.gameInfo.version) {
        // Write it to the console
        console.log(oldVersion);
    }
}
