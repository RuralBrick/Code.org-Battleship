// https://tinyurl.com/battleship2code

// #region Constants
var Color = {
    clear: rgb(0, 0, 0, 0),
    lightTile: rgb(184, 226, 255, 0.5),
    lightShip: rgb(0, 0, 0, 0.5),
    badShip: rgb(255, 0, 0, 0.5)
};
var Direction = {
    hori: { x: 1, y: 0 },
    vert: { x: 0, y: 1 }
};
var DefaultBoard = {
    x: 0,
    y: 45,
    width: 320,
    height: 320
};
var RadioGroupValues = {
    "rg_modeSelection": [
        "rb_singleDevice",
        "rb_multiDevice"
    ],
    "rg_p1_ships": [
        "rb_p1_carrier",
        "rb_p1_battleship",
        "rb_p1_cruiser",
        "rb_p1_submarine",
        "rb_p1_destroyer"
    ],
    "rg_p2_ships": [
        "rb_p2_carrier",
        "rb_p2_battleship",
        "rb_p2_cruiser",
        "rb_p2_submarine",
        "rb_p2_destroyer"
    ]
};
var RadioButtonValue = {
    "rb_p1_carrier": "carrier",
    "rb_p2_carrier": "carrier",

    "rb_p1_battleship": "battleship",
    "rb_p2_battleship": "battleship",

    "rb_p1_cruiser": "cruiser",
    "rb_p2_cruiser": "cruiser",

    "rb_p1_submarine": "submarine",
    "rb_p2_submarine": "submarine",

    "rb_p1_destroyer": "destroyer",
    "rb_p2_destroyer": "destroyer",

    "rb_singleDevice": "single",
    "rb_multiDevice": "multi"
};
var ShipSize = {
    "carrier": 5,
    "battleship": 4,
    "cruiser": 3,
    "submarine": 3,
    "destroyer": 2
};
var ViewHitTimeout = 800;
// #endregion
// #region Tile Class
function Tile(x, y) {
    this.x = x;
    this.y = y;
}
Tile.CheckCollision = function (tile1, tile2) {
    if (tile1.x === tile2.x && tile1.y === tile2.y) return true;
    else return false;
};
// #endregion
// #region Player Class
function Player(number, fleetBoard, targetBoard) {
    this.number = number;
    this.fleet = fleetBoard; this.fleet.Draw();
    this.target = targetBoard; this.target.Draw();
    this.ships = {
        carrier: null,
        battleship: null,
        cruiser: null,
        submarine: null,
        destroyer: null
    };
    this.locked = false,
        this.pegs = []; //the shots the opponent made to this side
}
Player.prototype.RefreshFleet = function () {
    this.fleet.Draw();
    for (var ship in this.ships) {
        if (this.ships[ship] !== null) {
            this.ships[ship].Draw(this.fleet);
        }
    }
    for (var i = 0; i < this.pegs.length; i++) {
        this.pegs[i].Draw(this.fleet);
    }
};
Player.prototype.RefreshTarget = function (pegs) {
    this.target.Draw();
    for (var i = 0; i < pegs.length; i++) {
        pegs[i].Draw(this.target);
    }
};
Player.prototype.DrawTemp = function () {
    this.ships[tempType] = null;
    this.RefreshFleet();

    var color = Color.badShip;
    if (tempShip.CheckValid(this.fleet, this.ships)) color = Color.lightShip;
    tempShip.Draw(this.fleet, color);
};
Player.prototype.SubmitTemp = function () {
    if (tempType !== null && tempShip.CheckValid(this.fleet, this.ships)) {
        this.ships[tempType] = new Ship(tempShip.size, tempShip.x, tempShip.y, tempShip.direction);
    } else {
        console.log("Can't log ship");
    }
    this.RefreshFleet();
};
Player.prototype.LockShips = function () {
    for (var type in typesAvailable) {
        if (typesAvailable[type] && this.ships[type] === null) {
            console.log("Not all ships placed");
            return false;
        }
    }
    tempShip = new Ship(0);
    tempType = null;
    this.locked = true;
    return true;
};
Player.prototype.LogFire = function () {
    if (tempTile === null) {
        console.log("missing tempTile");
        return false;
    }
    for (var i = 0; i < this.pegs.length; i++) {
        if (Tile.CheckCollision(tempTile, this.pegs[i])) {
            console.log("firing on peg");
            return false;
        }
    }
    var color = "white";
    for (var ship in this.ships) {
        if (this.ships[ship] !== null) {
            if (this.ships[ship].CheckHit(tempTile, ship, this.number)) {
                color = "red";
                if (this.ships[ship].CheckSunk()) {
                    var num = this.number % 2 + 1;
                    UpdateMessage("p" + num, ship + " sunk");
                }
            }
        }
    }
    var peg = new Peg(tempTile.x, tempTile.y, color);
    this.pegs.push(peg);
    if (mode === "multi") {
        CreatePegRecord(peg, this.number);
    }
    tempTile = null;
    return true;
};
Player.prototype.CheckLost = function () {
    for (var ship in this.ships) {
        if (this.ships[ship] !== null) {
            if (!this.ships[ship].CheckSunk()) {
                return false;
            }
        }
    }
    return true;
};
// #endregion
// #region Board Class
function Board(name, size) {
    this.name = name;
    this.size = size;
    this.x = getXPosition(name);
    this.y = getYPosition(name);
    this.width = getProperty(name, "width");
    this.height = getProperty(name, "height");
    this.scale = { x: this.width / size, y: this.height / size };
}
Board.prototype.Draw = function () {
    setActiveCanvas(this.name);

    setStrokeWidth(1);
    setStrokeColor(Color.clear);
    setFillColor("white");
    rect(0, 0, this.width, this.height);

    setStrokeWidth(1);
    setStrokeColor("black");
    for (var i = 0; i <= this.size; i++) {
        line(i * this.scale.x, 0, i * this.scale.x, this.height);
        line(0, i * this.scale.y, this.width, i * this.scale.y);
    }
};
Board.prototype.ReturnTile = function (mouseX, mouseY) {
    var x = Math.floor(mouseX / this.scale.x);
    var y = Math.floor(mouseY / this.scale.y);
    return new Tile(x, y);
};
Board.prototype.ColorRegion = function (x, y, width, height, color, border) {
    setActiveCanvas(this.name);

    setStrokeWidth(1);
    if (border === undefined) setStrokeColor("black");
    else setStrokeColor(border);
    setFillColor(color);
    rect(
        x * this.scale.x,
        y * this.scale.y,
        width * this.scale.x,
        height * this.scale.y
    );
};
Board.prototype.ColorCircle = function (x, y, color, border) {
    setActiveCanvas(this.name);

    setStrokeWidth(1);
    if (border === undefined) setStrokeColor("black");
    else setStrokeColor(border);
    setFillColor(color);
    circle(
        (x + 0.5) * this.scale.x,
        (y + 0.5) * this.scale.y,
        Math.min(this.scale.x, this.scale.y) * 0.4 //slightly less than radius to leave breathing room
    );
};
// #endregion
// #region Ship Class
function Ship(size, x, y, direction) {
    this.x = x || 0;
    this.y = y || 0;
    this.size = size;
    this.direction = direction || Direction.hori;
    this.hits = [];
    this.sunk = false;
}
Ship.CheckCollision = function (ship1, ship2) {
    var dx = ship2.x - ship1.x;
    var dy = ship2.y - ship1.y;
    var dim1 = ship1.GetDimensions();
    var dim2 = ship2.GetDimensions();
    //check if each ship's x and y components are within the other ship's widths and heights, respectively
    if (
        Math.abs(Math.floor(dx / dim1.width) * Math.floor(-dx / dim2.width)) +
        Math.abs(Math.floor(dy / dim1.height) * Math.floor(-dy / dim2.height))
        === 0
    ) {
        return true;
    }
    return false;
};
Ship.prototype.GetDimensions = function () {
    var w = Math.pow(this.size, this.direction.x);
    var h = Math.pow(this.size, this.direction.y);
    return { width: w, height: h };
};
Ship.prototype.SetPosition = function (x, y) {
    this.x = x;
    this.y = y;
};
Ship.prototype.SetDirection = function (dir) {
    this.direction = dir;
};
Ship.prototype.ChangeDirection = function () {
    if (this.direction === Direction.hori) {
        this.direction = Direction.vert;
    } else {
        this.direction = Direction.hori;
    }
};
Ship.prototype.ReturnTiles = function () {
    //return an array of the tiles taken up by the ship
    var takenTiles = [];
    for (var i = 0; i < this.size; i++) {
        takenTiles.push(new Tile(this.x + i * this.direction.x, this.y + i * this.direction.y));
    }
    return takenTiles;
};
Ship.prototype.CheckValid = function (board, ships) {
    if (this.x + this.size * this.direction.x > board.size || this.y + this.size * this.direction.y > board.size) {
        return false;
    }
    if (ships !== undefined) {
        for (var i in ships) {
            if (ships[i] !== null) {
                if (Ship.CheckCollision(this, ships[i])) return false;
            }
        }
    }
    return true;
};
Ship.prototype.CheckHit = function (tile, type, number) {
    var body = this.ReturnTiles();
    for (var i = 0; i < body.length; i++) {
        if (Tile.CheckCollision(tile, body[i])) {
            this.hits.push(tile);
            if (mode === "multi") {
                CreateHitRecord(tile, type, number);
            }
            return true;
        }
    }
    return false;
};
Ship.prototype.CheckSunk = function () {
    if (this.hits.length >= this.size) {
        this.sunk = true;
    } else {
        this.sunk = false;
    }
    return this.sunk;
};
Ship.prototype.Draw = function (board, color) {
    var c = color || "gray";
    board.ColorRegion(
        this.x,
        this.y,
        Math.pow(this.size, this.direction.x),
        Math.pow(this.size, this.direction.y),
        c
    );
};
// #endregion
// #region Peg Class
function Peg(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
}
Peg.prototype.Draw = function (board) {
    board.ColorCircle(this.x, this.y, this.color);
};
// #endregion

// #region Global Variables
var id;
var hash;
var mode;
var boardSize;
var currentPlayer;
var player1;
var player2;
var typesAvailable = {
    "destroyer": true,
    "submarine": true,
    "cruiser": true,
    "battleship": true,
    "carrier": true
};
var showMessages;
var turn;
var tempShip = new Ship(0);
var tempType = null;
var tempTile = null;
// #endregion
// #region Global Functions
// #region Global Getters
function ReturnCurrentPlayer() {
    if (currentPlayer === 1) {
        return player1;
    }
    else if (currentPlayer === 2) {
        return player2;
    }
    else {
        return null;
    }
}
// #endregion
// #region Initialization Functions
function InitializeGame() {
    boardSize = getNumber("sld_boardSize");

    typesAvailable.carrier = getChecked("chk_carrier");
    typesAvailable.battleship = getChecked("chk_battleship");
    typesAvailable.cruiser = getChecked("chk_cruiser");
    typesAvailable.submarine = getChecked("chk_submarine");
    typesAvailable.destroyer = getChecked("chk_destroyer");

    showMessages = getChecked("chk_showMessages");

    HideFireControls("p1");
    HideFireControls("p2");
}
function InitializePlayer1() {
    player1 = new Player(
        1,
        new Board("cnv_player1self", boardSize),
        new Board("cnv_player1other", boardSize)
    );
}
function InitializePlayer2() {
    player2 = new Player(
        2,
        new Board("cnv_player2self", boardSize),
        new Board("cnv_player2other", boardSize)
    );
}
function autosetup() {
    InitializeGame();
    InitializePlayer1();
    InitializePlayer2();
    HideShipEdit("p1");
    HideShipEdit("p2");
    for (var type in typesAvailable) {
        if (typesAvailable[type]) {
            player1.ships[type] = AutoShip(type, player1.fleet, player1.ships);
            player2.ships[type] = AutoShip(type, player2.fleet, player2.ships);
        }
    }
    player1.LockShips();
    player2.LockShips();
    turn = "player1";
    setScreen("scn_player1wait");
}
function AutoShip(type, board, ships) {
    var size = ShipSize[type];
    var dir = randomNumber(0, 1) === 0 ? Direction.hori : Direction.vert;
    var maxX = boardSize - Math.pow(size, dir.x);
    var maxY = boardSize - Math.pow(size, dir.y);
    var ship = new Ship(size, randomNumber(0, maxX), randomNumber(0, maxY), dir);
    while (!ship.CheckValid(board, ships)) {
        ship.SetDirection(randomNumber(0, 1) === 0 ? Direction.hori : Direction.vert);
        ship.SetPosition(randomNumber(0, maxX), randomNumber(0, maxY));
    }
    return ship;
}
// #endregion
// #region Database Functions
//create functions
function CreateGameRecord() {
    hash = getTime().toString(36).toUpperCase();

    createRecord("games",
        {
            hash: hash,
            boardSize: boardSize,
            turn: turn,
            showMessages: showMessages
        },
        function (record) {
            id = record.id;
            console.log("Saved game: " + record.hash);
        }
    );
    createRecord("types",
        {
            hash: hash,
            carrier: typesAvailable.carrier,
            battleship: typesAvailable.battleship,
            cruiser: typesAvailable.cruiser,
            submarine: typesAvailable.submarine,
            destroyer: typesAvailable.destroyer
        },
        function (record) {
            console.log("Saved types: " + record.hash);
        }
    );
}
function CreatePlayerRecord(player) {
    if (hash !== undefined) {
        createRecord("players",
            {
                hash: hash,
                number: player.number,
                locked: player.locked,
                fleet: player.fleet.name,
                target: player.target.name
            },
            function (record) {
                console.log("Saved player" + record.number + ": " + record.hash);

                for (var type in player.ships) {
                    var ship = player.ships[type];
                    if (ship !== null) {
                        createRecord("ships",
                            {
                                hash: hash,
                                playerNumber: player.number,
                                type: type,
                                x: ship.x,
                                y: ship.y,
                                size: ship.size,
                                dirX: ship.direction.x,
                                dirY: ship.direction.y,
                                sunk: ship.sunk
                            },
                            function (rec) {
                                console.log("Saved player" + rec.playerNumber + " " + rec.type + ": " + rec.hash);
                            }
                        );
                    }
                }
            }
        );
        createRecord("boards",
            {
                hash: hash,
                name: player.fleet.name,
                size: player.fleet.size,
                x: player.fleet.x,
                y: player.fleet.y,
                width: player.fleet.width,
                height: player.fleet.height,
                scaleX: player.fleet.scale.x,
                scaleY: player.fleet.scale.y
            },
            function (record) {
                console.log("Saved fleet " + record.name + ": " + record.hash);
            }
        );
        createRecord("boards",
            {
                hash: hash,
                name: player.target.name,
                size: player.target.size,
                x: player.target.x,
                y: player.target.y,
                width: player.target.width,
                height: player.target.height,
                scaleX: player.fleet.scale.x,
                scaleY: player.fleet.scale.y
            },
            function (record) {
                console.log("Saved target " + record.name + ": " + record.hash);
            }
        );
    }
}
function CreatePegRecord(peg, number) {
    createRecord("pegs",
        {
            hash: hash,
            playerNumber: number,
            x: peg.x,
            y: peg.y,
            color: peg.color
        },
        function (record) {
            console.log("peg logged to player" + record.playerNumber + ": " + record.hash);
        }
    );
}
function CreateHitRecord(hit, type, number) {
    createRecord("hits",
        {
            hash: hash,
            playerNumber: number,
            shipType: type,
            x: hit.x,
            y: hit.y
        },
        function (record) {
            console.log("hit logged to player" + record.playerNumber + " " + record.shipType + ": " + record.hash);
        }
    );
}
//read functions
function JoinGame(hash) {
    //load game with hash; if successful, continue; else, red-out input
    readRecords("games", { hash: hash }, function (games) {
        if (games.length > 0) {
            var game = games[0];

            id = game.id;
            boardSize = game.boardSize;
            turn = game.turn;
            showMessages = game.showMessages;
            InitializePlayer2();
            currentPlayer = 2;

            //load types
            readRecords("types", { hash: hash }, function (typesList) {
                if (typesList.length > 0) {
                    var types = typesList[0];

                    typesAvailable.carrier = types.carrier;
                    typesAvailable.battleship = types.battleship;
                    typesAvailable.cruiser = types.cruiser;
                    typesAvailable.submarine = types.submarine;
                    typesAvailable.destroyer = types.destroyer;

                    CensorShipChoices("p2");
                    HideFireControls("p2");

                    //load player 1
                    readRecords("players", { hash: hash, number: 1 }, function (players) {
                        if (players.length > 0) {
                            var p = players[0];

                            player1 = new Player(
                                1,
                                new Board(p.fleet, boardSize),
                                new Board(p.target, boardSize)
                            );
                            player1.locked = p.locked;

                            //load player 1 ships
                            readRecords("ships", { hash: hash, playerNumber: 1 }, function (ships) {
                                if (ships.length > 0) {
                                    for (var i = 0; i < ships.length; i++) {
                                        var ship = ships[i];
                                        player1.ships[ship.type] = new Ship(ship.size, ship.x, ship.y, { x: ship.dirX, y: ship.dirY });
                                    }
                                    setScreen("scn_player2self");
                                }
                                else {
                                    console.log("found no player 1 ships");
                                }
                            });
                        }
                        else {
                            console.log("couldn't find player 1");
                            setScreen("scn_player2self");
                        }
                    });
                }
                else {
                    console.log("couldn't find types");
                }
            });
        }
        else {
            console.log("couldn't find game");
            setProperty("txtin_gameID", "background-color", Color.badShip);
        }
    });
}
function Refresh() {
    readRecords("games", { hash: hash }, function (records) {
        if (records.length > 0) {
            var game = records[0];

            if (currentPlayer === 1 && player1 !== undefined) {
                player1.RefreshFleet();
                if (player2 !== undefined) player1.RefreshTarget(player2.pegs);
            }
            else if (currentPlayer === 2 && player2 !== undefined) {
                player2.RefreshFleet();
                if (player1 !== undefined) player2.RefreshTarget(player1.pegs);
            }

            if (game.turn === "player1") {
                turn = "player1";
                showElement("btn_p1o_fire");
                hideElement("btn_p1o_next");
                SetBattleTitles("player 1's turn");
            } else if (game.turn === "player2") {
                turn = "player2";
                showElement("btn_p2o_fire");
                hideElement("btn_p2o_next");
                SetBattleTitles("player 2's turn");
            } else if (game.turn === "game over") {
                hideElement("btn_p1o_fire");
                hideElement("btn_p2o_fire");
                showElement("btn_p1o_next");
                showElement("btn_p2o_next");
                SetBattleTitles("game over");
            }
        }
    });
    readRecords("pegs", { hash: hash, playerNumber: currentPlayer }, function (records) {
        if (records.length > 0) {
            var pegs = [];
            for (var i = 0; i < records.length; i++) {
                var peg = records[i];
                pegs.push(new Peg(peg.x, peg.y, peg.color));
            }
            ReturnCurrentPlayer().pegs = pegs;
        } else {
            console.log("no player" + currentPlayer + " pegs to log");
        }
    });
    readRecords("hits", { hash: hash, playerNumber: currentPlayer }, function (records) {
        if (records.length > 0) {
            var hits = {
                "carrier": [],
                "battleship": [],
                "cruiser": [],
                "submarine": [],
                "destroyer": []
            };
            for (var i = 0; i < records.length; i++) {
                var hit = records[i];
                hits[hit.shipType].push(new Tile(hit.x, hit.y));
            }
            for (var ship in hits) {
                if (ReturnCurrentPlayer().ships[ship] !== null) {
                    ReturnCurrentPlayer().ships[ship].hits = hits[ship];
                }
            }
        } else {
            console.log("no player" + currentPlayer + " hits to log");
        }
    });
}
//update functions
function UpdateGameRecord(state) {
    updateRecord("games", { id: id, hash: hash, boardSize: boardSize, turn: state, showMessages: showMessages }, function (record, success) {
        if (success) {
            console.log("updated turn: " + record.hash);
        } else {
            console.log("failed to update turn");
            SetBattleTitles("please refresh");
        }
    });
}
//listeners
onRecordEvent("games", function (record, eventType) {
    if (eventType === "update" && record.hash === hash) {
        if (currentPlayer === 1) {
            player1.RefreshFleet();
            if (player2 !== undefined) player1.RefreshTarget(player2.pegs);
            if (record.turn === "player1") {
                setTimeout(function () {
                    setScreen("scn_player1other");
                }, ViewHitTimeout);
            }
        }
        else if (currentPlayer === 2) {
            player2.RefreshFleet();
            if (player1 !== undefined) player2.RefreshTarget(player1.pegs);
            if (record.turn === "player2") {
                setTimeout(function () {
                    setScreen("scn_player2other");
                }, ViewHitTimeout);
            }
        }

        if (record.turn === "player1") {
            turn = "player1";
            showElement("btn_p1o_fire");
            hideElement("btn_p1o_next");
            SetBattleTitles("player 1's turn");
        } else if (record.turn === "player2") {
            turn = "player2";
            showElement("btn_p2o_fire");
            hideElement("btn_p2o_next");
            SetBattleTitles("player 2's turn");
        } else if (record.turn === "game over") {
            hideElement("btn_p1o_fire");
            hideElement("btn_p2o_fire");
            showElement("btn_p1o_next");
            showElement("btn_p2o_next");
            SetBattleTitles("game over");
        }
    }
});
onRecordEvent("players", function (record, eventType) {
    if (eventType === "create" && record.hash === hash) {
        if (record.number === 2 && currentPlayer === 1) {
            player2 = new Player(
                2,
                new Board(record.fleet, boardSize),
                new Board(record.target, boardSize)
            );
            player2.locked = record.locked;

            if (player1.locked) {
                turn = "player1";
                UpdateGameRecord(turn);

                showElement("btn_p1o_fire");
                hideElement("btn_p1o_next");
                setScreen("scn_player1other");
            } else {
                SetBattleTitles("player 2 waiting");
            }
        }
        else if (record.number === 1 && currentPlayer === 2) {
            player1 = new Player(
                1,
                new Board(record.fleet, boardSize),
                new Board(record.target, boardSize)
            );
            player1.locked = record.locked;

            if (!player2.locked) {
                SetBattleTitles("player 1 waiting");
            }
        }
    }
});
onRecordEvent("ships", function (record, eventType) {
    if (eventType === "create" && record.hash === hash) {
        if (record.playerNumber === 1) {
            player1.ships[record.type] = new Ship(record.size, record.x, record.y, { x: record.dirX, y: record.dirY });
        } else if (record.playerNumber === 2) {
            player2.ships[record.type] = new Ship(record.size, record.x, record.y, { x: record.dirX, y: record.dirY });
        }
    }
});
onRecordEvent("pegs", function (record, eventType) {
    if (eventType === "create" && record.hash === hash && record.playerNumber === currentPlayer) {
        ReturnCurrentPlayer().pegs.push(new Peg(record.x, record.y, record.color));
        ReturnCurrentPlayer().RefreshFleet(0);
    }
});
onRecordEvent("hits", function (record, eventType) {
    if (eventType === "create" && record.hash === hash && record.playerNumber === currentPlayer) {
        ReturnCurrentPlayer().ships[record.shipType].hits.push(new Tile(record.x, record.y));
    }
});
// #endregion
// #region UI Functions
function GetRadioGroupValue(name) {
    var index = 0;
    while (
        index < RadioGroupValues[name].length &&
        !getChecked(RadioGroupValues[name][index])
    ) {
        index++;
    }
    return RadioGroupValues[name][index];
}
function HideShipEdit(player) {
    for (var type in typesAvailable) {
        hideElement("rb_" + player + "_" + type);
        hideElement("lbl_" + player + "_" + type);
    }
    hideElement("btn_" + player + "s_submit");
    hideElement("btn_" + player + "s_finish");
}
function HideFireControls(player) {
    hideElement("btn_" + player + "o_fire");
    hideElement("btn_" + player + "o_next");
}
function HideRefresh() {
    hideElement("btn_p1o_refresh");
    hideElement("btn_p1s_refresh");
    hideElement("btn_p2o_refresh");
    hideElement("btn_p2s_refresh");
}
function CensorShipChoices(player) {
    for (var type in typesAvailable) {
        if (typesAvailable[type]) {
            setChecked("rb_" + player + "_" + type, true);
            showElement("rb_" + player + "_" + type);
            showElement("lbl_" + player + "_" + type);
        } else {
            hideElement("rb_" + player + "_" + type);
            hideElement("lbl_" + player + "_" + type);
        }
    }
}
function UpdateTemp(type, x, y) {
    //if clicked on same temp, just rotate
    if (tempType === type && tempShip.x === x && tempShip.y === y) {
        tempShip.ChangeDirection();
    }
    //otherwise update position/type
    else {
        var size = ShipSize[type];
        var dir = Direction.hori;
        tempShip = new Ship(size, x, y, dir);
        tempType = type;
    }
}
function LightTypes(obj, tag) {
    for (var type in typesAvailable) {
        if (typesAvailable[type] === true && obj.ships[type] === null) {
            setProperty("lbl_" + tag + "_" + type, "background-color", Color.badShip);
        } else {
            setProperty("lbl_" + tag + "_" + type, "background-color", Color.clear);
        }
    }
}
function SetBattleTitles(text) {
    setText("lbl_p1o_title", text);
    setText("lbl_p1s_title", text);
    setText("lbl_p2o_title", text);
    setText("lbl_p2s_title", text);
}
function UpdateMessage(player, text) {
    if (showMessages) {
        var textbox = "txt_" + player + "o_messages";
        var message = text + "\n" + getText(textbox);
        setText(textbox, message);
    }
}
// #endregion
// #endregion

/////////////////
//Player Events//
/////////////////
// #region Title Screen
onEvent("btn_title_start", "click", function () {
    setScreen("scn_settings");
});
// #endregion
// #region Settings Screen
onEvent("btn_joinGame", "click", function () {
    mode = "multi";
    setScreen("scn_joinGame");
});
onEvent("sld_boardSize", "input", function () {
    setText("txt_boardSize", getNumber("sld_boardSize"));
});
onEvent("btn_settings_start", "click", function () {
    mode = RadioButtonValue[GetRadioGroupValue("rg_modeSelection")];

    if (mode === "multi") {
        InitializeGame();
        InitializePlayer1();
        CreateGameRecord();

        currentPlayer = 1;
        CensorShipChoices("p1");
        SetBattleTitles("game id: " + hash);
        setScreen("scn_player1self");
    } else {
        InitializeGame();
        InitializePlayer1();
        InitializePlayer2();
        HideRefresh();
        CensorShipChoices("p1");
        CensorShipChoices("p2");
        setScreen("scn_player1self");
    }
});
// #endregion
// #region Join Screen
onEvent("txtin_gameID", "change", function () {
    hash = getText("txtin_gameID").toUpperCase();
    JoinGame(hash);
});
onEvent("btn_join", "click", function () {
    hash = getText("txtin_gameID").toUpperCase();
    JoinGame(hash);
});
// #endregion
// #region Battle Screens
// #region player 1 wait
onEvent("btn_p1w_start", "click", function () {
    player1.RefreshFleet();
    player1.RefreshTarget(player2.pegs);
    showElement("btn_p1o_fire");
    hideElement("btn_p1o_next");
    setScreen("scn_player1other");
});
// #endregion
// #region player 1 self
onEvent("btn_p1s_refresh", "click", function () {
    Refresh();
});
onEvent("btn_p1s_switch", "click", function () {
    setScreen("scn_player1other");
});
onEvent("cnv_player1self", "click", function (event) {
    if (!player1.locked) {
        var tile = player1.fleet.ReturnTile(event.offsetX, event.offsetY);
        var type = RadioButtonValue[GetRadioGroupValue("rg_p1_ships")];
        UpdateTemp(type, tile.x, tile.y);
        player1.DrawTemp();
    }
});
onEvent("btn_p1s_submit", "click", function () {
    player1.SubmitTemp();
});
onEvent("btn_p1s_finish", "click", function () {
    if (player1.LockShips()) {
        if (mode === "multi") {
            CreatePlayerRecord(player1);

            if (player2 !== undefined) {
                turn = "player1";
                UpdateGameRecord(turn);

                SetBattleTitles("player 1's turn");
                showElement("btn_p1o_fire");
                hideElement("btn_p1o_next");
            }

            player1.RefreshFleet();
            setScreen("scn_player1other");
            HideShipEdit("p1");
        } else {
            setScreen("scn_player2self");
            HideShipEdit("p1");
        }
    }
    else {
        LightTypes(player1, "p1");
    }
});
// #endregion
// #region player 1 other
onEvent("btn_p1o_refresh", "click", function () {
    Refresh();
});
onEvent("btn_p1o_switch", "click", function () {
    setScreen("scn_player1self");
});
onEvent("cnv_player1other", "click", function (event) {
    if (turn === "player1") {
        tempTile = player1.target.ReturnTile(event.offsetX, event.offsetY);
        player1.RefreshTarget(player2.pegs);
        player1.target.ColorRegion(tempTile.x, tempTile.y, 1, 1, Color.lightTile);
    }
});
onEvent("btn_p1o_fire", "click", function () {
    if (player2.LogFire()) {
        if (mode === "multi") {
            player1.RefreshTarget(player2.pegs);
            //pegs (and hit) to databases <-- in Player & Ship methods

            hideElement("btn_p1o_fire");

            if (player2.CheckLost()) {
                UpdateGameRecord("game over");
                showElement("btn_p1o_next");
                SetBattleTitles("game over");
            } else {
                turn = "player2";
                UpdateGameRecord(turn);
                SetBattleTitles("player 2's turn");
                setTimeout(function () {
                    setScreen("scn_player1self");
                }, ViewHitTimeout);
            }
        } else {
            player1.RefreshTarget(player2.pegs);
            turn = "player2";

            hideElement("btn_p1o_fire");
            showElement("btn_p1o_next");
        }
    }
});
onEvent("btn_p1o_next", "click", function () {
    if (mode === "multi") {
        setScreen("scn_" + turn + "win");
    } else {
        if (player2.CheckLost()) {
            setScreen("scn_player1win");
        } else {
            setScreen("scn_player2wait");
        }
    }
});
// #endregion
// #region player 2 wait
onEvent("btn_p2w_start", "click", function () {
    player2.RefreshFleet();
    player2.RefreshTarget(player1.pegs);
    showElement("btn_p2o_fire");
    hideElement("btn_p2o_next");
    setScreen("scn_player2other");
});
// #endregion
// #region player 2 self
onEvent("btn_p2s_refresh", "click", function () {
    Refresh();
});
onEvent("btn_p2s_switch", "click", function () {
    setScreen("scn_player2other");
});
onEvent("cnv_player2self", "click", function (event) {
    if (!player2.locked) {
        var tile = player2.fleet.ReturnTile(event.offsetX, event.offsetY);
        var type = RadioButtonValue[GetRadioGroupValue("rg_p2_ships")];
        UpdateTemp(type, tile.x, tile.y);
        player2.DrawTemp();
    }
});
onEvent("btn_p2s_submit", "click", function () {
    player2.SubmitTemp();
});
onEvent("btn_p2s_finish", "click", function () {
    if (player2.LockShips()) {
        if (mode === "multi") {
            CreatePlayerRecord(player2);

            if (player1 === undefined) {
                SetBattleTitles("waiting for player 1");
            } else {
                SetBattleTitles("player 1's turn");
            }

            player2.RefreshFleet();
            setScreen("scn_player2other");
            HideShipEdit("p2");
        } else {
            turn = "player1";
            setScreen("scn_player1wait");
            HideShipEdit("p2");
        }
    }
    else {
        LightTypes(player2, "p2");
    }
});
// #endregion
// #region player 2 other
onEvent("btn_p2o_refresh", "click", function () {
    Refresh();
});
onEvent("btn_p2o_switch", "click", function () {
    setScreen("scn_player2self");
});
onEvent("cnv_player2other", "click", function (event) {
    if (turn === "player2") {
        tempTile = player2.target.ReturnTile(event.offsetX, event.offsetY);
        player2.RefreshTarget(player1.pegs);
        player2.target.ColorRegion(tempTile.x, tempTile.y, 1, 1, Color.lightTile);
    }
});
onEvent("btn_p2o_fire", "click", function () {
    if (player1.LogFire()) {
        if (mode === "multi") {
            player2.RefreshTarget(player1.pegs);
            //pegs (and hit) to databases

            hideElement("btn_p2o_fire");

            if (player1.CheckLost()) {
                UpdateGameRecord("game over");
                showElement("btn_p2o_next");
                SetBattleTitles("game over");
            } else {
                turn = "player1";
                UpdateGameRecord(turn);
                SetBattleTitles("player 1's turn");
                setTimeout(function () {
                    setScreen("scn_player2self");
                }, ViewHitTimeout);
            }
        } else {
            player2.RefreshTarget(player1.pegs);
            turn = "player1";

            hideElement("btn_p2o_fire");
            showElement("btn_p2o_next");
        }
    }
});
onEvent("btn_p2o_next", "click", function () {
    if (mode === "multi") {
        setScreen("scn_" + turn + "win");
    } else {
        if (player1.CheckLost()) {
            setScreen("scn_player2win");
        } else {
            setScreen("scn_player1wait");
        }
    }
});
// #endregion
// #endregion
