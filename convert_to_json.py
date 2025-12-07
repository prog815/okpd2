#!/usr/bin/env python3
"""
Конвертер данных ОКПД2 из TSV-формата в JavaScript-файл.
Читает файл okpd_table.tsv из корня проекта.
Формат: каждая строка - код[табуляция]наименование, без заголовков.
"""

import json
import sys
from datetime import datetime
from pathlib import Path

def main():
    # Пути к файлам
    input_file = Path("okpd_table.tsv")
    output_file = Path("data.js")

    print(f"🔍 Конвертация: {input_file} -> {output_file}")

    # Проверка существования исходного файла
    if not input_file.exists():
        print(f"❌ Ошибка: Файл {input_file} не найден в корне проекта.")
        print("   Создайте его или скопируйте сюда.")
        sys.exit(1)

    processed_data = []
    line_num = 0

    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            for line in f:
                line_num += 1
                raw_line = line.rstrip('\n')

                # Пропускаем полностью пустые строки
                if not raw_line.strip():
                    continue

                # Разделяем строку по табуляции
                parts = raw_line.split('\t')

                # Проверяем, что в строке минимум два столбца
                # (Вторая часть может быть пустой, но разделитель должен быть)
                if len(parts) < 2:
                    print(f"⚠️  Строка {line_num}: пропущена. Не найден разделитель табуляции.")
                    print(f"    Содержимое: '{raw_line}'")
                    continue

                code = parts[0].strip()
                name = parts[1].strip()

                # Базовая валидация: код не должен быть пустым
                if not code:
                    print(f"⚠️  Строка {line_num}: пропущена. Код пустой.")
                    continue

                # Извлекаем раздел (первые две цифры) для фильтрации
                section = ""
                # Ищем все цифры в коде
                digits = ''.join(filter(str.isdigit, code))
                if len(digits) >= 2:
                    section = digits[:2]

                processed_data.append({
                    "code": code,
                    "name": name,
                    "section": section  # Например, "01" или "10"
                })

    except Exception as e:
        print(f"❌ Ошибка при чтении файла (строка {line_num}): {e}")
        sys.exit(1)

    # Вывод отчёта
    print(f"📊 Обработано строк из файла: {line_num}")
    print(f"📦 Успешно загружено записей: {len(processed_data)}")

    if not processed_data:
        print("❌ Нет данных для обработки. Проверьте файл.")
        sys.exit(1)

    # Формируем содержимое JS-файла
    js_content = f"""// Данные справочника ОКПД2
// Сгенерировано автоматически из {input_file.name}
// Дата генерации: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
// Количество записей: {len(processed_data)}

const okpd2Data = {json.dumps(processed_data, ensure_ascii=False, indent=2)};
"""

    # Записываем результат
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print(f"✅ Файл создан: {output_file}")
    except Exception as e:
        print(f"❌ Ошибка при записи {output_file}: {e}")
        sys.exit(1)

    # Выводим пример для проверки
    print("\n📋 Примеры записей для проверки (первые 3):")
    for i, item in enumerate(processed_data[:3]):
        name_preview = item['name'][:50] + '...' if len(item['name']) > 50 else item['name']
        print(f"  {i+1}. Код: {item['code']:12} -> {name_preview}")

if __name__ == "__main__":
    main()