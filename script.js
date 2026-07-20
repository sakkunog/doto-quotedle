const board = document.getElementById('game-board');
const Kboard = document.getElementById('keyboard');
let isGame = true;
let rawWord = 'wordl';
let word = rawWord.replace(/\s/g, "").toUpperCase();
let guessWord = '';
let currentGuess = 0;
const totalGuesses = 6;
let grid = [];

let validWordsList = [];
let diction = [
    'https://raw.githubusercontent.com/mstgnz/words/refs/heads/main/lang/en/length/3_letter_words.txt',
    'https://raw.githubusercontent.com/mstgnz/words/refs/heads/main/lang/en/length/4_letter_words.txt',
    'https://raw.githubusercontent.com/mstgnz/words/refs/heads/main/lang/en/length/5_letter_words.txt',
    'https://raw.githubusercontent.com/mstgnz/words/refs/heads/main/lang/en/length/6_letter_words.txt',
    'https://raw.githubusercontent.com/mstgnz/words/refs/heads/main/lang/en/length/7_letter_words.txt'
];

const btnDaily = document.getElementById('daily-btn');
const btnRnd = document.getElementById('rnd-btn');

async function loadDictionary(word) {
    const listWords = diction[word.length-3];
    try {
        const output = await fetch(listWords);
        if (!output.ok) throw new Error("Failed to load online TXT");
        
        const text = await output.text();
        validWordsList = text
            .trim()
            .split(/\r?\n/)
            .map(line => line.trim().toUpperCase())
            .filter(line => line !== "");
    } catch (error) {
        console.error("TXT Error:", error);
        return [];
    }
}

async function generateGame(type) {
    if (!isGame && type !== 'daily' && type !== 'random') return;
    isGame = true;
    currentGuess = 0;
    guessWord = '';
    grid = [];
    board.innerHTML = '';
    
    try {
        const response = await fetch('quotes.tsv');
        const text = await response.text();
        
        const rows = text
            .trim()
            .split(/\r?\n/)
            .map(row => row.split('\t'));

        const dataRows = rows.slice(1);
        if (dataRows.length === 0) return;

        let selectedRow;

        if (type === 'daily') {
            const today = new Date().toISOString().slice(0, 10);
            let hash = 0;
            for (let i = 0; i < today.length; i++) {
                hash = today.charCodeAt(i) + ((hash << 5) - hash);
            }
            const index = Math.abs(hash) % dataRows.length;
            selectedRow = dataRows[index];
        } else {
            const randomIndex = Math.floor(Math.random() * dataRows.length);
            selectedRow = dataRows[randomIndex];
        }

        const [number, author, year, quote, answerWord, flavour = ""] = selectedRow;

        rawWord = answerWord.trim();
        word = rawWord.replace(/\s/g, "").toUpperCase();

        const formattedQuote = quote.replace('$$ITEM$$', '_'.repeat(rawWord.length));
        const finalQuestionText = `${formattedQuote} - ${author}, ${year}`;

        document.querySelector('#game-question h1').textContent = finalQuestionText;
        createBoard(rawWord, totalGuesses);

        console.log("Selected Answer:", rawWord);
        console.log("Question Display:", finalQuestionText);

    } catch (error) {
        console.error("Error processing TSV:", error);
    }
}

let keyboard = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ["Enter",'Z','X','C','V','B','N','M',"Backspace"]
];

function createBoard(word, rows) {
    for (let i = 0; i < rows; i++) {
        let rowArray = [];
        let row = document.createElement('div');
        row.classList.add('grid-row');
        row.style.gridTemplateColumns = `repeat(${word.length}, 1fr)`;
        for (let char of word) {
            let block = document.createElement('span');
            if (char !== ' ') {
                block.classList.add('letter-box');
                rowArray.push(block);
            } else {
                block.classList.add('empty-letter-box');
            }
            row.append(block);
        }
        board.append(row);
        grid.push(rowArray);
    }
}

function createKeyboard(keyboard) {
    Kboard.addEventListener('click', (event) => {
        if (event.target.classList.contains('key-button')) {
            const key = event.target.textContent;
            btnPress(key);
        }
    });
    for (let i = 0; i < keyboard.length; i++) {
            let row = document.createElement('div');
            row.style.display = 'grid'; 
            row.style.gridTemplateColumns = `repeat(${keyboard[i].length}, auto)`;
            for (let k = 0; k < keyboard[i].length; k++) {
                let button = document.createElement('button');
                button.classList.add('key-button');
                button.textContent = keyboard[i][k];
                row.append(button);
            }
        Kboard.append(row);
    }
}

document.addEventListener('keydown', (event) => {   
    if (isGame) {
        const key = event.key;
        btnPress(key);
    }
});

function btnPress(key) {
    if ((key === 'Enter' && guessWord.length === word.length && isGame === true)
    && (validWordsList.includes(guessWord) || word === guessWord)) {
        let letters = word.split('')
        for (let i = 0; i < guessWord.length; i++) {
            if (grid[currentGuess][i].textContent === word[i]) {
                grid[currentGuess][i].style.backgroundColor = "MediumSeaGreen";
                letters.splice(letters.indexOf(guessWord[i]), 1);
            }
        };
        for (let i = 0; i < guessWord.length; i++) {
            if (letters.includes(grid[currentGuess][i].textContent) && 
                !(grid[currentGuess][i].textContent === word[i])) {
                grid[currentGuess][i].style.backgroundColor = "Orange";
                letters.splice(letters.indexOf(guessWord[i]), 1)
            } else if ((grid[currentGuess][i].textContent !== word[i]) &&
                !(letters.includes(grid[currentGuess][i].textContent))) {
                grid[currentGuess][i].style.backgroundColor = "DimGray";
                Array.from(Kboard.querySelectorAll('.key-button')).find(b => b.textContent === guessWord[i]).style.backgroundColor = "DimGray";
            }
        }
        currentGuess += 1;
        if (guessWord.toUpperCase() !== word.toUpperCase()) {
            guessWord = '';
        } else { isGame = false; }
    } else if (key === 'Backspace' && guessWord.length > 0) {
        grid[currentGuess][guessWord.length-1].textContent = "";
        guessWord = guessWord.slice(0, -1);
    } else if (/^[a-zA-Z]$/.test(key) && guessWord.length < word.length) {
        grid[currentGuess][guessWord.length].textContent = key.toUpperCase();
        guessWord += key.toUpperCase();
    }
}

createBoard(rawWord, totalGuesses);
console.log(grid);
createKeyboard(keyboard);
loadDictionary(word);
generateGame('daily');

btnDaily.addEventListener('click', () => {
    generateGame('daily');
});
btnRnd.addEventListener('click', () => {
    generateGame('random');
});
