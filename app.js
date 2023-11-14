$(document).ready(function() {
    var logs = 0;
    var money = 0;
    var logPlus = 1;
    var autoLogPlus = 0;
    var autoChopperPrice = 100;
    var chopperSpeedMultiplier = 1;
    var logPrice = 1;
    var planks = 0; // New resource: planks
    var plankPrice = 4; // Added missing plankPrice variable
    var sawmillPrice = 1000; // Price of the sawmill
    var sawmillSpeed = 1000; // Time interval for sawmill operation (in milliseconds)
    var menu;
    var autochopperInterval;
    var autochopperlevel = 0;
    var sawmillActive = false; // Flag to check if the sawmill is active
    var autoSellerLogsToSell = 1; // Adjust the number of logs to sell as needed
    var autoSellerInterval = 5000; // Interval in milliseconds (e.g., every 5 seconds)
    var autoSellerLevel = 1; // Flag to check if the auto seller is active
    var logHeightMultiplier = 1.5;
    var autoSellerTimer; // Variable to store the timer ID
    var autosellerCost = 500; // Adjust the cost as needed
    $("#chop").click(function() {
        logs += logPlus;
        changeInventory();
        changeMarket();
    });

    $("#visit").click(function() {
        menu = switchMenu("marketplace");
        changeMarket();
    });

    $("#return").click(function() {
        menu = switchMenu("main");
    });
    function updateLogPile() {
        // Calculate the height or background position based on the number of logs
        var logPileHeight = logs * logHeightMultiplier; // Adjust logHeightMultiplier as needed
    
        // Update the log pile's style
        $(".log-pile").css("height", logPileHeight + "px");
    }
    
    $("#autochopper").click(function() {
        if (money >= autoChopperPrice) {
            money -= autoChopperPrice;
            autochopperlevel++;
            autoLogPlus = autoLogPlus + autochopperlevel;
            changeInventory();
            changeMarket();
            activateAutoChopper();
            updateLogPile();

            autoChopperPrice *= 2;
            chopperSpeedMultiplier++;

            $("#autochopper").text("Buy Autochopper [$" + autoChopperPrice + "]");
            changeMarket();
        }
    });
    // $(document).ready(function() {
    //     function addLogsToContainer(logs) {
    //         var logContainer = $(".log-container");
    //         logContainer.empty(); 
          
    //         for (var i = 0; i < logs; i++) {
    //           var logImage = $("<img>").attr("src", "log-image.png");
    //           logContainer.append(logImage);
    //         }
    //       }      });
    function activateAutoSeller() {
        autoSellerTimer = setInterval(function() {
            if (logs >= autoSellerLogsToSell) {
                logs -= autoSellerLogsToSell;
                money += autoSellerLogsToSell * logPrice;
                changeInventory();
                changeMarket();
                updateLogPile();

            }
        }, autoSellerInterval);
    }


    $("#autoseller").click(function() {
        // Define the cost of the autoseller
        
    
        // Check if the player has enough money to buy the autoseller
        if (money >= autosellerCost) {
            // Deduct the cost from the player's money

            // Update the UI to reflect the deduction
            changeInventory();
            if (autoSellerLevel === 1) {
                money -= autosellerCost;
                autosellerCost = autosellerCost * 2;

                // Activate the autoseller
                activateAutoSeller();
                autoSellerLevel++;
            } else {
                money -= autosellerCost;
                autosellerCost = autosellerCost * 2;
                autoSellerLogsToSell = autoSellerLogsToSell * autoSellerLevel;
                autoSellerLevel++;

            }
            // Update the autoseller button text to indicate it's purchased
            $(this).text('Autoseller ' + autosellerCost);
    
            // Optionally, you can change the styling to indicate it's purchased
            $(this).addClass('purchased'); // Add a CSS class for styling
        } else {
            // Player doesn't have enough money to buy the autoseller
            alert('You do not have enough money to purchase the autoseller.');
        }

    });
    
        
    function activateAutoChopper() {
        autochopperInterval = setInterval(function() {
            logs += autoLogPlus;
            changeInventory();
            changeMarket();
            updateLogPile();

        }, 2500 / autoLogPlus);
    }
    $("#sawmill").click(function() {
        if (money >= sawmillPrice && !sawmillActive) {
            money -= sawmillPrice;
            activateSawmill();
            changeInventory();
            $("#sawmill").text("Buy Sawmill [$" + sawmillPrice + "]");
            changeMarket();
            updateLogPile();

        }
    });

    function activateSawmill() {
        sawmillActive = true;
        setInterval(function() {
            if (logs >= 1) {
                logs -= 1;
                planks += 1;
                changeInventory();
                changeMarket();
                updateLogPile();

            }
        }, sawmillSpeed);
    }

    function changeInventory() {
        $("#money").html("Money: $" + money);
        $("#logs").html("You now own " + logs + " logs.");
        $("#planks").html("You now own " + planks + " planks."); // Display planks
    }

    $("#sell1").click(function() {
        if (logs >= 1) {
            logs -= 1;
            money += logPrice;
            changeInventory();
            changeMarket();
            updateLogPile();

        }
    });

    $("#sell10").click(function() {
        if (logs >= 10) {
            logs -= 10;
            money += 10 * logPrice;
            changeInventory();
            changeMarket();
            updateLogPile();

        }
    });

    $("#sellAll").click(function() {
        if (logs > 0) {
            money += logs * logPrice;
            logs = 0;
            changeInventory();
            changeMarket();
            updateLogPile();

        }
    });

    function changeMarket() {
        if (logs > 0) {
            $("#sellAll").css("display", "block");
        } else {
            $("#sellAll").css("display", "none");
        }
        if (logs >= 1) {
            $("#sell1").css("display", "block");
        } else {
            $("#sell1").css("display", "none");
        }
        if (logs >= 1 && !sawmillActive) {
            $("#sawmill").css("display", "block");
        } else {
            $("#sawmill").css("display", "none");
        } 
    }

    function switchMenu(menu) {
        $(".menus").children().css("display", "none");
        $("." + menu).css("display", "block");
        return menu;
    }
});
