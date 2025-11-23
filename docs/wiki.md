# Wiki: todo (React Native)

## Что внутри
- Локальная база SQLite (react-native-sqlite-storage), хранит задачи офлайн.
- Две вкладки: «Текущие» и «Архив» (выполненные), смена статуса одним нажатием.
- Добавление через модальное окно (название обязательно, описание — опционально).
- Темная/светлая темы, переключатель в правом верхнем углу.
- Удаление доступно для выполненных задач в архиве.

## Установка и запуск
```bash
git clone https://github.com/angstremoff/todo.git
cd todo
npm install
```

### Android
```bash
# запустить Metro (если не стартует автоматически)
npx react-native start --port 8081

# собрать и поставить на подключенное устройство/эмулятор
cd android
./gradlew app:installDebug -x lint --no-daemon

# открыть активити (замените DEVICE_ID при необходимости)
adb reverse tcp:8081 tcp:8081
adb shell am start -n com.todo/.MainActivity
```

### iOS
Проект создан под RN 0.73.9. Для сборки нужно:
```bash
cd ios
pod install
cd ..
npx react-native run-ios
```
(Потребуются Xcode и настроенный симулятор/устройство.)

## Генерация APK
```bash
cd android
./gradlew assembleDebug
```
Файл будет в `android/app/build/outputs/apk/debug/app-debug.apk`. Его можно копировать и распространять как debug-билд. Для release-билда понадобится добавить свой keystore и подписку в `android/app/build.gradle`.

## Структура
- `App.tsx` — главный экран, логика UI и модалок.
- `src/db/tasks.ts` — CRUD для SQLite.
- `src/components/*` — UI-компоненты (SegmentedControl, TaskCard, EmptyState).
- `src/theme` — темы и контекст.
- `docs/wiki.md` — это руководство.
