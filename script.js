"use strict";

const exerciseStore = (() => {
  const exercises = [
    {
      id: "neck-stretch",
      name: "아침 목/어깨 스트레칭",
      category: ["posture", "stretch"],
      tags: ["turtleNeck", "sitting", "beginner", "none"],
      duration: 60,
      difficulty: "쉬움",
      description: "고개를 천천히 좌우와 앞뒤로 움직이며 목과 어깨 주변 긴장을 풀어줍니다.",
      caution: "목을 강하게 꺾지 말고 통증이 느껴지면 즉시 멈추세요.",
      videoPath: "assets/videos/neck-stretch.mp4"
    },
    {
      id: "chair-shoulder",
      name: "의자 어깨 스트레칭",
      category: ["posture", "stretch"],
      tags: ["turtleNeck", "sitting", "chair", "beginner"],
      duration: 90,
      difficulty: "쉬움",
      description: "의자에 앉아 한쪽 팔을 반대쪽으로 당겨 어깨와 등 윗부분을 부드럽게 늘립니다.",
      caution: "어깨가 올라가지 않게 낮추고 호흡을 편하게 유지하세요.",
      videoPath: "assets/videos/chair-shoulder.mp4"
    },
    {
      id: "chair-twist",
      name: "의자 비틀기",
      category: ["posture", "stretch"],
      tags: ["backPain", "sitting", "chair"],
      duration: 90,
      difficulty: "쉬움",
      description: "의자에 바르게 앉아 상체를 천천히 좌우로 돌려 허리와 등 근육을 깨웁니다.",
      caution: "허리를 반동으로 비틀지 말고 시선과 어깨가 함께 움직이게 하세요.",
      videoPath: "assets/videos/chair-twist.mp4"
    },
    {
      id: "wrist-stretch",
      name: "손목 스트레칭",
      category: ["stretch"],
      tags: ["sitting", "beginner", "none"],
      duration: 60,
      difficulty: "쉬움",
      description: "손바닥과 손등을 번갈아 당기며 키보드와 필기로 뭉친 손목을 풀어줍니다.",
      caution: "손목에 날카로운 통증이 있으면 각도를 줄이세요.",
      videoPath: "assets/videos/wrist-stretch.mp4"
    },
    {
      id: "cat-cow",
      name: "고양이 자세 스트레칭",
      category: ["posture", "stretch"],
      tags: ["backPain", "mat", "beginner"],
      duration: 120,
      difficulty: "쉬움",
      description: "네발기기 자세에서 등을 둥글게 말고 다시 펴며 척추 움직임을 부드럽게 만듭니다.",
      caution: "손목이 불편하면 팔꿈치를 살짝 굽히거나 쉬어가세요.",
      videoPath: "assets/videos/cat-cow.mp4"
    },
    {
      id: "mckenzie",
      name: "맥킨지 운동",
      category: ["posture", "strength"],
      tags: ["backPain", "mat"],
      duration: 120,
      difficulty: "보통",
      description: "엎드린 상태에서 상체를 천천히 들어 허리 앞쪽을 열고 뻐근함을 완화합니다.",
      caution: "허리 통증이 다리로 내려가거나 심해지면 중단하세요.",
      videoPath: "assets/videos/mckenzie.mp4"
    },
    {
      id: "slow-burpee",
      name: "슬로우 버피",
      category: ["strength", "weightLoss", "cardio"],
      tags: ["none", "mat", "noise"],
      duration: 150,
      difficulty: "보통",
      description: "점프 없이 천천히 스쿼트, 플랭크, 일어서기 동작을 연결해 전신을 사용합니다.",
      caution: "무릎과 손목에 부담이 크면 속도를 낮추고 동작 범위를 줄이세요.",
      videoPath: "assets/videos/slow-burpee.mp4"
    }
  ];

  const getAll = () => exercises.map((exercise) => ({ ...exercise }));

  return { getAll };
})();

class RoutineRecommender {
  constructor(exercises) {
    this.exercises = exercises;
  }

  recommend(preferences) {
    const ranked = this.exercises
      .map((exercise) => ({
        exercise,
        score: this.calculateScore(exercise, preferences)
      }))
      .sort((a, b) => b.score - a.score);

    return this.buildTimedRoutine(ranked.map((item) => item.exercise), preferences.availableMinutes);
  }

  calculateScore(exercise, preferences) {
    const goalScore = exercise.category.includes(preferences.goal) ? 4 : 0;
    const conditionScore = this.countMatches(exercise.tags, preferences.conditions) * 2;
    const environmentScore = this.countMatches(exercise.tags, preferences.environments) * 2;
    const quietBonus = preferences.conditions.includes("noise") && exercise.id === "slow-burpee" ? 2 : 0;

    return goalScore + conditionScore + environmentScore + quietBonus;
  }

  countMatches(source, targets) {
    return targets.filter((target) => source.includes(target)).length;
  }

  buildTimedRoutine(exercises, availableMinutes) {
    const targetSeconds = availableMinutes * 60;
    const selected = this.selectBaseExercises(exercises, targetSeconds);

    return this.expandSetsToTarget(selected, targetSeconds, availableMinutes);
  }

  selectBaseExercises(exercises, targetSeconds) {
    const maxExerciseCount = targetSeconds <= 300 ? 3 : targetSeconds <= 600 ? 4 : 5;
    const selected = [];
    let totalSeconds = 0;

    exercises.forEach((exercise) => {
      const canAdd = totalSeconds + exercise.duration <= targetSeconds + 60;

      if (selected.length < maxExerciseCount && canAdd) {
        selected.push(this.createRoutineItem(exercise));
        totalSeconds += exercise.duration;
      }
    });

    this.includeLongRoutineAnchor(selected, exercises, targetSeconds);

    return selected.length ? selected : exercises.slice(0, 3).map((exercise) => this.createRoutineItem(exercise));
  }

  includeLongRoutineAnchor(selected, exercises, targetSeconds) {
    const anchorExercise = exercises.find((exercise) => exercise.id === "slow-burpee");
    const alreadyIncluded = selected.some((item) => item.exercise.id === "slow-burpee");

    if (targetSeconds < 900 || !anchorExercise || alreadyIncluded) return;

    selected[selected.length - 1] = this.createRoutineItem(anchorExercise);
  }

  createRoutineItem(exercise) {
    return {
      exercise,
      sets: 1,
      repetitions: this.getRepetitions(exercise),
      totalDuration: exercise.duration
    };
  }

  getRepetitions(exercise) {
    if (exercise.id === "slow-burpee") return "8회";
    if (exercise.category.includes("stretch")) return "좌우 2회";
    return "6회";
  }

  expandSetsToTarget(routine, targetSeconds, availableMinutes) {
    const minSeconds = availableMinutes >= 20 ? 18 * 60 : Math.max(0, targetSeconds - 60);
    const maxSeconds = targetSeconds + 60;
    let totalSeconds = this.getRoutineDuration(routine);

    while (totalSeconds < targetSeconds) {
      const nextItem = this.findBestSetCandidate(routine, totalSeconds, targetSeconds, maxSeconds);

      if (!nextItem) break;

      nextItem.sets += 1;
      nextItem.totalDuration = nextItem.exercise.duration * nextItem.sets;
      totalSeconds = this.getRoutineDuration(routine);
    }

    while (totalSeconds < minSeconds) {
      const shortestItem = [...routine].sort((a, b) => a.exercise.duration - b.exercise.duration)[0];

      shortestItem.sets += 1;
      shortestItem.totalDuration = shortestItem.exercise.duration * shortestItem.sets;
      totalSeconds = this.getRoutineDuration(routine);
    }

    return routine;
  }

  findBestSetCandidate(routine, totalSeconds, targetSeconds, maxSeconds) {
    return routine
      .filter((item) => totalSeconds + item.exercise.duration <= maxSeconds)
      .sort((a, b) => {
        if (a.sets !== b.sets) return a.sets - b.sets;

        const aGap = Math.abs(targetSeconds - (totalSeconds + a.exercise.duration));
        const bGap = Math.abs(targetSeconds - (totalSeconds + b.exercise.duration));

        return aGap - bGap;
      })[0];
  }

  getRoutineDuration(routine) {
    return routine.reduce((sum, item) => sum + item.totalDuration, 0);
  }
}

class CountdownTimer {
  constructor(onTick, onComplete) {
    this.onTick = onTick;
    this.onComplete = onComplete;
    this.initialSeconds = 30;
    this.remainingSeconds = 30;
    this.intervalId = null;
  }

  set(seconds) {
    this.pause();
    this.initialSeconds = seconds;
    this.remainingSeconds = seconds;
    this.notify();
  }

  start() {
    if (this.intervalId) return;

    this.intervalId = window.setInterval(() => {
      this.remainingSeconds -= 1;
      this.notify();

      if (this.remainingSeconds <= 0) {
        this.pause();
        this.onComplete();
      }
    }, 1000);
  }

  pause() {
    window.clearInterval(this.intervalId);
    this.intervalId = null;
  }

  reset() {
    this.pause();
    this.remainingSeconds = this.initialSeconds;
    this.notify();
  }

  notify() {
    this.onTick(this.remainingSeconds);
  }
}

const labels = {
  posture: "자세 교정",
  stretch: "스트레칭",
  strength: "근력 강화",
  weightLoss: "체중 감량",
  cardio: "전신 유산소",
  turtleNeck: "거북목",
  backPain: "허리 뻐근함",
  beginner: "운동 초보",
  noise: "층간소음 걱정",
  sitting: "장시간 앉아있음",
  none: "장비 없음",
  chair: "의자 있음",
  mat: "매트 있음"
};

const appState = {
  routine: [],
  currentWorkoutIndex: 0,
  preferences: null
};

const dom = {
  screens: {
    input: document.querySelector("#inputScreen"),
    result: document.querySelector("#resultScreen"),
    workout: document.querySelector("#workoutScreen"),
    completion: document.querySelector("#completionScreen")
  },
  form: document.querySelector("#preferenceForm"),
  customTimeWrap: document.querySelector("#customTimeWrap"),
  customTime: document.querySelector("#customTime"),
  routineList: document.querySelector("#routineList"),
  selectionSummary: document.querySelector("#selectionSummary"),
  startRoutineButton: document.querySelector("#startRoutineButton"),
  workoutProgress: document.querySelector("#workoutProgress"),
  workoutName: document.querySelector("#workoutName"),
  workoutDescription: document.querySelector("#workoutDescription"),
  workoutSetInfo: document.querySelector("#workoutSetInfo"),
  videoArea: document.querySelector("#videoArea"),
  timerDisplay: document.querySelector("#timerDisplay"),
  completedTotalTime: document.querySelector("#completedTotalTime"),
  completedExerciseCount: document.querySelector("#completedExerciseCount"),
  completionEncouragement: document.querySelector("#completionEncouragement"),
  exitMessage: document.querySelector("#exitMessage")
};

const recommender = new RoutineRecommender(exerciseStore.getAll());
const timer = new CountdownTimer(renderTimer, () => {});

function getCheckedValues(name) {
  return [...document.querySelectorAll(`[name="${name}"]:checked`)].map((input) => input.value);
}

function readPreferences(form) {
  const formData = new FormData(form);
  const timeType = formData.get("timeType");
  const customMinutes = Number(dom.customTime.value) || 10;

  return {
    goal: formData.get("goal"),
    availableMinutes: timeType === "custom" ? customMinutes : Number(timeType),
    conditions: getCheckedValues("condition"),
    environments: getCheckedValues("environment")
  };
}

function showScreen(screenName) {
  Object.values(dom.screens).forEach((screen) => screen.classList.remove("is-active"));
  dom.screens[screenName].classList.add("is-active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderRoutine(routine) {
  dom.routineList.innerHTML = routine.map(createExerciseCard).join("");
}

function createExerciseCard(exercise) {
  const item = exercise;
  const baseExercise = item.exercise;

  return `
    <article class="exercise-card">
      <div class="card-head">
        <div>
          <h3>${baseExercise.name}</h3>
          <p>${getReason(baseExercise, appState.preferences)}</p>
        </div>
        <span class="badge">${baseExercise.difficulty}</span>
      </div>
      <div class="meta-row">
        <span>총 ${formatDuration(item.totalDuration)}</span>
        <span>${item.sets}세트</span>
        <span>반복 ${item.repetitions}</span>
        <span>${formatDuration(baseExercise.duration)} × ${item.sets}세트</span>
        <span>${baseExercise.category.map((category) => labels[category]).join(" · ")}</span>
      </div>
      <p><strong>주의사항</strong> ${baseExercise.caution}</p>
    </article>
  `;
}

function getReason(exercise, preferences) {
  const matchedConditions = preferences.conditions.filter((condition) => exercise.tags.includes(condition));
  const matchedEnvironments = preferences.environments.filter((environment) => exercise.tags.includes(environment));
  const reasons = [...matchedConditions, ...matchedEnvironments].map((item) => labels[item]);

  if (exercise.category.includes(preferences.goal)) {
    reasons.unshift(labels[preferences.goal]);
  }

  return reasons.length
    ? `${reasons.slice(0, 3).join(", ")}에 잘 맞는 동작입니다.`
    : "짧은 시간에 몸을 깨우기 좋은 기본 동작입니다.";
}

function getRoutineTotalDuration(routine) {
  return routine.reduce((sum, item) => sum + item.totalDuration, 0);
}

function renderSelectionSummary(preferences, routine) {
  const conditionText = preferences.conditions.map((item) => labels[item]).join(", ") || "특이사항 없음";
  const totalSeconds = getRoutineTotalDuration(routine);

  dom.selectionSummary.textContent =
    `${labels[preferences.goal]} 목표 · ${preferences.availableMinutes}분 가능 · ${conditionText} 기준으로 총 예상 ${formatDuration(totalSeconds)} 루틴을 추천했어요.`;
}

function renderWorkout() {
  const routineItem = appState.routine[appState.currentWorkoutIndex];
  const exercise = routineItem.exercise;

  dom.workoutProgress.textContent = `${appState.currentWorkoutIndex + 1} / ${appState.routine.length}`;
  dom.workoutName.textContent = exercise.name;
  dom.workoutDescription.textContent = exercise.description;
  dom.workoutSetInfo.innerHTML = `
    <span>${routineItem.sets}세트</span>
    <span>반복 ${routineItem.repetitions}</span>
    <span>총 ${formatDuration(routineItem.totalDuration)}</span>
  `;
  renderVideo(exercise.videoPath);
  timer.set(routineItem.totalDuration);
}

function renderCompletion(routine) {
  const totalSeconds = getRoutineTotalDuration(routine);

  dom.completedTotalTime.textContent = formatDuration(totalSeconds);
  dom.completedExerciseCount.textContent = `${routine.length}개`;
  dom.completionEncouragement.textContent =
    "바쁜 하루 속에서도 몸을 챙긴 멋진 선택이에요. 내일은 더 가볍게 시작할 수 있을 거예요.";
  dom.exitMessage.hidden = true;
}

function renderVideo(videoPath) {
  dom.videoArea.innerHTML = `
    <video controls playsinline preload="metadata">
      <source src="${videoPath}" type="video/mp4">
    </video>
  `;

  const video = dom.videoArea.querySelector("video");
  video.addEventListener("error", renderVideoPlaceholder, { once: true });
}

function renderVideoPlaceholder() {
  dom.videoArea.innerHTML = `<div class="video-placeholder">영상 준비 중</div>`;
}

function renderTimer(seconds) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
  const restSeconds = String(safeSeconds % 60).padStart(2, "0");

  dom.timerDisplay.textContent = `${minutes}:${restSeconds}`;
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;

  return restSeconds ? `${minutes}분 ${restSeconds}초` : `${minutes}분`;
}

function moveWorkout(direction) {
  const nextIndex = appState.currentWorkoutIndex + direction;

  if (nextIndex >= appState.routine.length) {
    timer.pause();
    renderCompletion(appState.routine);
    showScreen("completion");
    return;
  }

  if (nextIndex < 0) return;

  appState.currentWorkoutIndex = nextIndex;
  renderWorkout();
}

function resetApp() {
  timer.set(30);
  appState.routine = [];
  appState.currentWorkoutIndex = 0;
  appState.preferences = null;

  dom.form.reset();
  dom.customTime.value = "15";
  dom.customTimeWrap.classList.remove("is-visible");
  dom.routineList.innerHTML = "";
  dom.selectionSummary.textContent = "";
  dom.videoArea.innerHTML = "";
  dom.workoutSetInfo.innerHTML = "";
  dom.exitMessage.hidden = true;
  showScreen("input");
}

function renderExitMessage() {
  dom.exitMessage.hidden = false;
}

function bindEvents() {
  dom.form.addEventListener("submit", (event) => {
    event.preventDefault();
    appState.preferences = readPreferences(event.currentTarget);
    appState.routine = recommender.recommend(appState.preferences);

    renderSelectionSummary(appState.preferences, appState.routine);
    renderRoutine(appState.routine);
    showScreen("result");
  });

  document.querySelectorAll('[name="timeType"]').forEach((input) => {
    input.addEventListener("change", () => {
      dom.customTimeWrap.classList.toggle("is-visible", input.value === "custom" && input.checked);
    });
  });

  dom.startRoutineButton.addEventListener("click", () => {
    appState.currentWorkoutIndex = 0;
    renderWorkout();
    showScreen("workout");
  });

  document.addEventListener("click", (event) => {
    const action = event.target.dataset.action;
    const timerAction = event.target.dataset.timer;

    if (action === "back-to-input") showScreen("input");
    if (action === "back-to-result") showScreen("result");
    if (action === "next-workout") moveWorkout(1);
    if (action === "prev-workout") moveWorkout(-1);
    if (action === "restart-app") resetApp();
    if (action === "exit-app") renderExitMessage();
    if (timerAction === "start") timer.start();
    if (timerAction === "pause") timer.pause();
    if (timerAction === "reset") timer.reset();
  });
}

bindEvents();
