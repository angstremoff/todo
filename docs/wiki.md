# Wiki: todo (React Native)

## Возможности
- Локальные рабочие пространства (папки) для задач. Примеры по умолчанию: «Расписание трансферов», «Задачи по проекту». Пространства можно добавлять и переименовывать.
- Задачи хранят только текст, без заголовков/описаний.
- Две вкладки: «Текущие» и «Архив» (выполненные), статус переключается одной кнопкой.
- Темная/светлая темы, переключатель в правом верхнем углу.
- Удаление доступно для задач в архиве.

## Установка и запуск
```bash
git clone https://github.com/angstremoff/todo.git
cd todo
npm install
```

### Android
```bash
# запустить Metro (если не запустился сам)
npx react-native start --port 8081

# собрать и установить на устройство/эмулятор
cd android
./gradlew app:installDebug -x lint --no-daemon

# открыть активити (при необходимости укажите свой DEVICE_ID)
adb reverse tcp:8081 tcp:8081
adb shell am start -n com.todo/.MainActivity
```

### iOS
Проект на RN 0.73.9. Понадобится Xcode и симулятор/устройство.
```bash
cd ios
pod install
cd ..
npx react-native run-ios
```

## Сборка APK
```bash
cd android
./gradlew assembleRelease -x lint --no-daemon
```
Файл появится в `android/app/build/outputs/apk/release/app-release.apk`. Сейчас используется debug-ключ, для продакшена подключите свой keystore в `android/app/build.gradle`.

## Структура
- `App.tsx` — UI и вся логика экранов/модалок.
- `src/db/tasks.ts` — SQLite: задачи и рабочие пространства.
- `src/components/*` — интерфейсные компоненты.
- `src/theme` — темы и контекст.
- `docs/wiki.md` — это руководство.
