// script.js

let deck = [];
let playerHand = [];
let dealerHand = [];
let playerTotal = 0;
let dealerTotal = 0;
let gameActive = true;
let totalScore = 0;
let chips = 100;
let currentBet = 0;
let insuranceBet = 0;
let autoPlayActive = false;

function createDeck(numDecks = 6) {
    const suits = ['♥', '♦', '♣', '♠'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    deck = [];
    for (let i = 0; i < numDecks; i++) {
        for (const suit of suits) {
            for (const value of values) {
                deck.push({ suit, value });
            }
        }
    }
    shuffleDeck();
}

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function dealCard(handElement) {
    const card = deck.pop();
    handElement.push(card);
    return card;
}

function calculateTotal(hand) {
    let total = 0;
    let aces = 0;
    for (const card of hand) {
        const value = card.value;
        if (['J', 'Q', 'K'].includes(value)) {
            total += 10;
        } else if (value === 'A') {
            total += 11;
            aces++;
        } else {
            total += parseInt(value);
        }
    }
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }
    return total;
}

function renderCards(hand, elementId, hideFirst = false) {
    const element = document.getElementById(elementId);
    element.innerHTML = '';
    for (let i = 0; i < hand.length; i++) {
        const card = hand[i];
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        if (hideFirst && i === 0) {
            cardElement.classList.add('hidden');
        } else {
            cardElement.textContent = `${card.value}${card.suit}`;
        }
        element.appendChild(cardElement);
    }
}

function startGame() {
    if (chips < 10) {
        alert("You don't have enough chips to continue!");
        return;
    }

    createDeck();
    playerHand = [];
    dealerHand = [];
    playerTotal = 0;
    dealerTotal = 0;
    gameActive = true;

    for (let i = 0; i < 2; i++) {
        dealCard(playerHand);
        dealCard(dealerHand);
    }

    playerTotal = calculateTotal(playerHand);
    dealerTotal = calculateTotal(dealerHand);

    renderCards(playerHand, 'player-cards');
    renderCards(dealerHand, 'dealer-cards', true);
    document.getElementById('player-total').textContent = playerTotal;
    document.getElementById('dealer-total').textContent = '?';

    // Check for Natural Blackjack
    if (playerTotal === 21) {
        stand();
    }
}

function hit() {
    if (!gameActive) return;
    dealCard(playerHand);
    playerTotal = calculateTotal(playerHand);
    renderCards(playerHand, 'player-cards');
    document.getElementById('player-total').textContent = playerTotal;

    if (playerTotal > 21) {
        endGame('You busted! You lost.', -currentBet);
    }
}

function stand() {
    if (!gameActive) return;
    gameActive = false;

    renderCards(dealerHand, 'dealer-cards');
    document.getElementById('dealer-total').textContent = dealerTotal;

    // Dealer must draw until they reach at least 17
    while (dealerTotal < 17) {
        dealCard(dealerHand);
        dealerTotal = calculateTotal(dealerHand);
        renderCards(dealerHand, 'dealer-cards');
        document.getElementById('dealer-total').textContent = dealerTotal;
    }

    // Check for dealer bust or compare totals
    if (dealerTotal > 21 || playerTotal > dealerTotal) {
        endGame('You win!', currentBet);
    } else if (playerTotal < dealerTotal) {
        endGame('You lose.', -currentBet);
    } else {
        endGame('It\'s a tie.', 0);
    }
}

function doubleDown() {
    if (!gameActive || playerHand.length !== 2) return;
    currentBet *= 2;
    hit();
    stand();
}

function split() {
    if (!gameActive || playerHand.length !== 2 || playerHand[0].value !== playerHand[1].value) return;
    const newHand = [playerHand.pop()];
    playerHand = [playerHand[0]];

    // Simulate a new hand for simplicity
    renderCards(playerHand, 'player-cards');
    startGame();
}

function insurance() {
    if (dealerHand[0].value !== 'A') return;
    insuranceBet = Math.min(currentBet / 2, chips);
    chips -= insuranceBet;
    document.getElementById('chips').textContent = chips;

    // Check if the dealer has Blackjack
    if (dealerHand[1].value === '10' || dealerHand[1].value === 'J' || dealerHand[1].value === 'Q' || dealerHand[1].value === 'K') {
        if (calculateTotal(dealerHand) === 21) {
            chips += insuranceBet * 2;
            alert("Dealer has Blackjack! Insurance paid.");
        } else {
            alert("Dealer does not have Blackjack. Insurance lost.");
        }
    }
}

function endGame(message, scoreChange) {
    gameActive = false;
    totalScore += scoreChange;
    chips -= currentBet;

    if (scoreChange > 0) {
        chips += currentBet * 2;
    }

    if (insuranceBet > 0 && dealerTotal === 21) {
        chips += insuranceBet * 2;
    }

    document.getElementById('total-score').textContent = totalScore;
    document.getElementById('chips').textContent = chips;

    const historyList = document.getElementById('history-list');
    const listItem = document.createElement('li');
    listItem.textContent = message;
    historyList.appendChild(listItem);

    let countdown = 3;
    const timer = setInterval(() => {
        document.getElementById('result').textContent = `Restarting in ${countdown} seconds...`;
        countdown--;
        if (countdown < 0) {
            clearInterval(timer);
            startGame();
        }
    }, 1000);
}

function toggleAutoPlay() {
    if (autoPlayActive) {
        autoPlayActive = false;
        document.getElementById('auto-play-toggle').textContent = 'Auto Play';
    } else {
        autoPlayActive = true;
        document.getElementById('auto-play-toggle').textContent = 'Stop Auto Play';
        const autoPlayInterval = setInterval(() => {
            if (!gameActive) {
                startGame();
            } else {
                if (playerTotal < 17) {
                    hit();
                } else {
                    stand();
                }
            }
        }, 2000); // Automatic play every 2 seconds
        document.getElementById('auto-play-toggle').addEventListener('click', () => {
            clearInterval(autoPlayInterval);
            toggleAutoPlay();
        });
    }
}

document.getElementById('rules-toggle').addEventListener('click', () => {
    const rulesSection = document.getElementById('rules-section');
    rulesSection.style.display = rulesSection.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('hit-button').addEventListener('click', hit);
document.getElementById('stand-button').addEventListener('click', stand);
document.getElementById('double-down-button').addEventListener('click', doubleDown);
document.getElementById('split-button').addEventListener('click', split);
document.getElementById('insurance-button').addEventListener('click', insurance);
document.getElementById('restart-button').addEventListener('click', startGame);
document.getElementById('place-bet').addEventListener('click', () => {
    const betInput = document.getElementById('bet-input');
    const betValue = parseInt(betInput.value);
    if (isNaN(betValue) || betValue < 10 || betValue > chips) {
        alert("Invalid bet. You must bet at least 10 chips.");
        return;
    }
    currentBet = betValue;
    startGame();
});

document.getElementById('auto-play-toggle').addEventListener('click', toggleAutoPlay);

startGame();