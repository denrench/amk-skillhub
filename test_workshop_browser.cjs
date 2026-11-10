const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const origin = process.env.SKILLHUB_TEST_URL || 'http://127.0.0.1:5000';
const samples = {it:7, graphic_design:8, autoelectric:8, hvac:1, automechanic:1};

async function openLesson(page, lesson) {
  await page.goto(`${origin}/lesson_player.html?lesson_id=${lesson.id}&specialty=${lesson.course_slug}&task=${lesson.order_num}`,
    {waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => typeof currentLesson !== 'undefined' && currentLesson);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.SKILLHUB_CHROME,
    args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'],
  });
  try {
    const page = await browser.newPage({viewport: {width: 390, height: 840}});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      const url = route.request().url();
      if (url.startsWith(origin + '/')) return route.continue();
      if (url.endsWith('/three.min.js') && process.env.SKILLHUB_THREE) {
        return route.fulfill({path: process.env.SKILLHUB_THREE, contentType: 'text/javascript'});
      }
      return route.abort();
    });
    const manifestResponse = await page.request.get(origin + '/api/lessons');
    const { lessons } = await manifestResponse.json();
    assert.equal(lessons.length, 50);

    await page.goto(origin + '/index.html', {waitUntil: 'domcontentloaded'});
    assert.equal(await page.locator('body.workshop').count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
    await page.getByRole('link', {name:'Выбрать специальность', exact:true}).click();
    await page.waitForURL('**/tasks.html');
    await page.locator('main a[href*="lesson_player.html"]').first().click();
    await page.waitForURL('**/lesson_player.html?*');

    await page.route('**/api/tasks?*', route => route.fulfill({status:404, contentType:'text/html', body:'Not found'}));
    await page.goto(origin + '/tasks.html?specialty=it', {waitUntil:'domcontentloaded'});
    await page.locator('main a[href*="catalog=1"]').first().click();
    await page.waitForFunction(() => typeof currentLesson !== 'undefined' && currentLesson?.id === 'catalog-it-1');
    await page.locator('#step-btn-2').click();
    await page.locator('#lp-video-play-btn').click();
    await page.waitForFunction(() => document.querySelector('#lp-lecture-video')?.currentTime > .1);
    await page.unroute('**/api/tasks?*');

    const pilot = lessons.find(lesson => lesson.course_slug === 'autoelectric' && lesson.order_num === 3);
    await openLesson(page, pilot);
    await page.locator('#step-btn-2').click();
    await page.locator('[data-play]').click();
    await page.waitForFunction(() => document.querySelector('.starter-video')?.currentTime > .1);
    await page.locator('#step-btn-3').click();
    await page.getByLabel('A · Плюс АКБ', {exact: true}).check();
    await page.getByLabel('B · Силовой вход стартера', {exact: true}).check();
    await page.getByRole('button', {name:'Проверить ответ'}).click();
    await page.getByText('Верно. Результат сохранён в этом браузере.').waitFor();
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => typeof currentLesson !== 'undefined' && currentLesson);
    await page.locator('#step-btn-3').click();
    await page.getByText('Задание выполнено. Ответ восстановлен.').waitFor();

    const actual = new Set();
    for (const lesson of lessons.filter(item => item !== pilot)) {
      await openLesson(page, lesson);
      const key = `${lesson.course_slug}-${lesson.order_num}`;
      const theory = await page.evaluate(() => currentLesson.blocks.find(block => block.type === 'theory'));
      assert.equal(theory.video_url, `assets/lesson-intros/${key}.mp4`);
      assert.equal(theory.video_captions, `assets/lesson-intros/${key}.vtt`);
      actual.add(theory.video_url);
      const media = await page.request.head(`${origin}/${theory.video_url}`);
      assert.equal(media.status(), 200);
      if (samples[lesson.course_slug] !== lesson.order_num) continue;
      await page.locator('#step-btn-2').click();
      await page.locator('#lp-video-play-btn').click();
      await page.waitForFunction(() => document.querySelector('#lp-lecture-video')?.currentTime > .1);
      await page.getByRole('button', {name:'Русские субтитры'}).click();
      assert.equal(await page.locator('#lp-video-captions').getAttribute('aria-pressed'), 'true');
      await page.locator('#step-btn-3').click();
      if (process.env.SKILLHUB_THREE) await page.locator('.workshop-visual canvas').waitFor();
      const point = page.locator('.workshop-model-panel [data-part]').first();
      await point.click();
      assert.equal(await point.getAttribute('aria-pressed'), 'true');
    }
    assert.equal(actual.size, 49);
    const auth = await page.request.post(origin + '/api/auth/login', {
      data: { email: 'teacher@amk.kz', password: 'teacher123' },
    });
    assert.equal((await auth.json()).success, true);
    await page.goto(origin + '/teacher.html', {waitUntil: 'domcontentloaded'});
    await page.locator('#t-tab-builder').click();
    const editor = page.locator('[data-video-block]').first();
    await editor.locator('[data-media-field="video_url"]').fill('assets/lesson-intros/it-1.mp4');
    await editor.locator('[data-preview-video]').click();
    const preview = editor.locator('video');
    await preview.waitFor();
    assert.match(await preview.getAttribute('src'), /\/assets\/lesson-intros\/it-1\.mp4$/);
    assert.deepEqual(errors, []);
    console.log('Catalog navigation, 49 intro sources, five playback and model samples, pilot progress, and teacher preview passed.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
