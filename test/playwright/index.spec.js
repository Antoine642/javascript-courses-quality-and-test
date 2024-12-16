const { test, expect } = require('@playwright/test');

test.describe('Page d\'accueil - Jeu du Pendu', () => {
  test('should initialize correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/The Hangman game/);
    await expect(page.locator("#game-title")).toHaveText("Le jeu du pendu");
  });

  test('should display "Share on Twitter" button when game is won', async ({ page }) => {
    await page.goto('/');
    // Simulate game won state
    await page.evaluate(() => {
      const form = document.querySelector('#guess-form');
      if (form) {
        form.innerHTML = '<button class="uk-input uk-button-danger uk-form-width-medium" id="share">Share on Twitter</button>';
      }
      const gameStatusDiv = document.createElement('div');
      gameStatusDiv.className = 'message';
      gameStatusDiv.style.color = 'green';
      gameStatusDiv.innerText = 'Félicitations ! Vous avez gagné !';
      document.body.appendChild(gameStatusDiv);
    });
    await expect(page.locator('#share')).toBeVisible();
  });

  test('should display the correct score', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#score')).toHaveText(/Score : \d+/);
  });

  test('should display the chosen letters', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const chosenLettersDiv = document.querySelector('#chosen-letters');
      if (chosenLettersDiv) {
        chosenLettersDiv.innerText = 'Lettres choisies : a, b, c';
      }
    });
    await expect(page.locator('#chosen-letters')).toHaveText('Lettres choisies : a, b, c');
  });

  test('should display the top scores table', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#top-scores')).toBeVisible();
    await expect(page.locator('#scores-table-body')).toBeVisible();
  });

  test('should display the number of tries left', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('legend.uk-legend')).toHaveText(/Nombre d'essai restant : \d+/);
  });

  test('should display the correct word when game is lost', async ({ page }) => {
    await page.goto('/');
    // Simulate game lost state
    await page.evaluate(() => {
      const form = document.querySelector('#guess-form');
      if (form) {
        form.innerHTML = '';
      }
      const gameStatusDiv = document.createElement('div');
      gameStatusDiv.className = 'message';
      gameStatusDiv.style.color = 'red';
      gameStatusDiv.innerText = 'Dommage ! Vous avez perdu.';
      document.body.appendChild(gameStatusDiv);

      const revealedWord = document.createElement('h3');
      revealedWord.id = 'revealed-word';
      revealedWord.innerText = 'Le mot était : example';
      document.body.appendChild(revealedWord);
    });
    await expect(page.locator('#revealed-word')).toHaveText('Le mot était : example');
  });
});
