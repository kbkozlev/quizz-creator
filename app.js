let questions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let currentQuizFile = null;

document.addEventListener('DOMContentLoaded', () => {
    showQuizSelector();

    document.getElementById('prevBtn').addEventListener('click', () => {
        saveUserAnswer();
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showQuestion();
        }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        saveUserAnswer();
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            showQuestion();
        }
    });

    document.getElementById('submitBtn').addEventListener('click', submitQuiz);

    document.getElementById('restartQuizBtn').addEventListener('click', restartQuiz);
    document.getElementById('restartBtn').addEventListener('click', restartQuiz);

    document.getElementById('selectNewQuizBtn').addEventListener('click', showQuizSelector);
    document.getElementById('selectAnotherQuizBtn').addEventListener('click', showQuizSelector);
});

function showQuizSelector() {
    document.getElementById('quiz').innerHTML = '';
    document.getElementById('quiz-selector').innerHTML = '<h3>Select a quiz:</h3>';
    document.getElementById('result').innerText = '';
    document.getElementById('navigation').style.display = 'none';
    document.getElementById('restartBtn').style.display = 'none';
    document.getElementById('selectAnotherQuizBtn').style.display = 'none';
    document.getElementById('quiz-controls').style.display = 'none';
    document.querySelector('#quiz-summary')?.remove();

    fetch('quizzes/selector.json')
  .then(res => res.json())
  .then(data => {
    Object.entries(data).forEach(([quizName, quizFile]) => {
      const btn = document.createElement('button');
      btn.textContent = quizName;
      btn.onclick = () => {
        currentQuizFile = quizFile;
        loadQuestions(quizFile);
      };
      document.getElementById('quiz-selector').appendChild(btn);
    });
  })
  .catch(err => {
    console.error("Failed to load selector.json:", err);
    document.getElementById('quiz-selector').innerHTML = '<p style="color:red;">Failed to load quizzes. Check selector.json.</p>';
  });

}

function loadQuestions(file) {
  fetch(`quizzes/${file}`)
    .then(res => res.json())
    .then(data => {
      questions = shuffleArray(data);
      userAnswers = {};
      currentQuestionIndex = 0;
      document.getElementById('quiz-selector').innerHTML = '';
      document.getElementById('quiz').style.display = 'block';
      document.getElementById('navigation').style.display = 'flex';
      document.getElementById('quiz-controls').style.display = 'block';
      showQuestion();
    })
    .catch(err => {
      console.error(`Failed to load quiz file '${file}':`, err);
      document.getElementById('quiz-selector').innerHTML = `<p style="color:red;">Failed to load quiz file: ${file}</p>`;
    });
}

function showQuestion() {
    const quizDiv = document.getElementById('quiz');
    const q = questions[currentQuestionIndex];
    const numCorrect = q.correct_answers.length;
    const inputType = numCorrect > 1 ? 'checkbox' : 'radio';

    quizDiv.innerHTML = `
  <div class="question-header-row">
    <div></div> <!-- empty for left spacing -->
    <div class="question-meta">Question ${currentQuestionIndex + 1} of ${questions.length}</div>
  </div>
  <div class="question-header">${q.question}</div>
  <div><em>Select ${numCorrect} answer${numCorrect > 1 ? 's' : ''}:</em></div>
  <div class="options">
    ${Object.entries(q.options).map(([key, value]) => {
      const checked = (userAnswers[q.question_number] || []).includes(key) ? 'checked' : '';
      return `
        <label class="option">
          <input type="${inputType}" name="option" value="${key}" ${checked}/> ${key}. ${value}
        </label>
      `;
    }).join('')}
  </div>
`;


    document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;
    document.getElementById('nextBtn').style.display = currentQuestionIndex < questions.length - 1 ? 'inline' : 'none';
    document.getElementById('submitBtn').style.display = currentQuestionIndex === questions.length - 1 ? 'inline' : 'none';
}

function saveUserAnswer() {
    const q = questions[currentQuestionIndex];
    const selected = [...document.querySelectorAll('input[name="option"]:checked')].map(e => e.value);
    userAnswers[q.question_number] = selected;
}

function submitQuiz() {
    saveUserAnswer();
    let score = 0;
    questions.forEach(q => {
        const selected = (userAnswers[q.question_number] || []).sort();
        const correct = q.correct_answers.sort();
        const allCorrect = selected.length === correct.length && selected.every((val, i) => val === correct[i]);
        if (allCorrect) score++;
    });

        const percentage = Math.round((score / questions.length) * 100);
        document.getElementById('quiz').style.display = 'none';
        document.getElementById('navigation').style.display = 'none';
        document.getElementById('quiz-controls').style.display = 'none';
        document.getElementById('result').innerText = `You scored ${score} out of ${questions.length} (${percentage}%)`;
        document.getElementById('restartBtn').style.display = 'inline';
        document.getElementById('selectAnotherQuizBtn').style.display = 'inline';

        showSummary();
}

function restartQuiz() {
  currentQuestionIndex = 0;
  userAnswers = {};
  questions = shuffleArray([...questions]); // 🔄 reshuffle on restart
  document.getElementById('result').innerText = '';
  document.getElementById('quiz').style.display = 'block';
  document.getElementById('navigation').style.display = 'flex';
  document.getElementById('quiz-controls').style.display = 'block';
  document.getElementById('restartBtn').style.display = 'none';
  document.getElementById('selectAnotherQuizBtn').style.display = 'none';
  document.querySelector('#quiz-summary')?.remove();
  showQuestion();
}


function showSummary() {
    const existing = document.querySelector('#quiz-summary');
    if (existing) existing.remove();

    const summaryDiv = document.createElement('div');
    summaryDiv.id = 'quiz-summary';
    summaryDiv.style.marginTop = '30px';

    questions.forEach((q, index) => {
        const userSelection = userAnswers[q.question_number] || [];
        const correctAnswers = q.correct_answers;

        const questionBlock = document.createElement('div');
        questionBlock.style.marginBottom = '20px';
        questionBlock.style.border = '1px solid #ccc';
        questionBlock.style.padding = '10px';
        questionBlock.style.borderRadius = '8px';
        questionBlock.style.backgroundColor = '#fff';

        const questionTitle = document.createElement('div');
        questionTitle.innerHTML = `<strong>Q${index + 1}:</strong> ${q.question}`;
        questionBlock.appendChild(questionTitle);

        const optionsList = document.createElement('ul');
        optionsList.style.listStyle = 'none';
        optionsList.style.paddingLeft = '0';

        Object.entries(q.options).forEach(([key, value]) => {
            const li = document.createElement('li');
            li.style.padding = '5px 10px';
            li.style.borderRadius = '4px';
            li.style.marginTop = '5px';
            li.style.border = '1px solid #ccc';

            const isCorrect = correctAnswers.includes(key);
            const isSelected = userSelection.includes(key);

            if (isCorrect && isSelected) {
                li.style.backgroundColor = '#c8f7c5';
                li.style.borderColor = '#2ecc71';
                li.style.fontWeight = 'bold';
            } else if (!isCorrect && isSelected) {
                li.style.backgroundColor = '#f7c5c5';
                li.style.borderColor = '#e74c3c';
                li.style.fontWeight = 'bold';
            } else if (isCorrect && !isSelected) {
                li.style.backgroundColor = '#eeeeee';
                li.style.borderColor = '#888';
                li.style.fontStyle = 'italic';
            }

            li.innerHTML = `<strong>${key}.</strong> ${value}`;
            optionsList.appendChild(li);
        });

        questionBlock.appendChild(optionsList);
        summaryDiv.appendChild(questionBlock);
    });

    document.getElementById('result').after(summaryDiv);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
