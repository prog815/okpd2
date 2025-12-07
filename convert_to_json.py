#!/usr/bin/env python3
"""
Конвертер данных ОКПД2 из TSV-формата в JavaScript-файл.
Читает файл okpd_table.tsv из корня проекта.
Формат: каждая строка - код[табуляция]наименование, без заголовков.
"""

import json
import sys
import os
from datetime import datetime
from pathlib import Path

def main():
    # Пути к файлам
    input_file = Path("okpd_table.tsv")
    output_file = Path("data.js")

    print(f"🔍 Конвертация: {input_file} -> {output_file}")

    if not input_file.exists():
        print(f"❌ Ошибка: Файл {input_file} не найден.")
        sys.exit(1)

    processed_data = []
    skipped_sections = 0
    line_num = 0

    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            for line in f:
                line_num += 1
                raw_line = line.rstrip('\n')

                if not raw_line.strip():
                    continue

                parts = raw_line.split('\t')

                if len(parts) < 2:
                    print(f"⚠️  Строка {line_num}: пропущена. Не найден разделитель табуляции.")
                    continue

                code = parts[0].strip()
                name = parts[1].strip()

                if not code:
                    print(f"⚠️  Строка {line_num}: пропущена. Код пустой.")
                    continue

                # === ФИЛЬТРАЦИЯ: пропускаем ТОЛЬКО буквенные разделы (A, B, C, ... U) ===
                if code.isalpha() and len(code) == 1 and code.isupper():
                    skipped_sections += 1
                    continue
                # Коды, заканчивающиеся на .000 или .00, НЕ пропускаем (они нужны)

                # Извлекаем раздел (первые две цифры) для фильтрации
                section = ""
                digits = ''.join(filter(str.isdigit, code))
                if len(digits) >= 2:
                    section = digits[:2]

                processed_data.append({
                    "code": code,
                    "name": name,
                    "section": section
                })

    except Exception as e:
        print(f"❌ Ошибка при чтении файла: {e}")
        sys.exit(1)

    # Вывод подробного отчёта
    print(f"📊 Прочитано строк из файла: {line_num}")
    print(f"🗑️  Пропущено буквенных разделов (A-U): {skipped_sections}")
    print(f"📦 Успешно загружено записей: {len(processed_data)}")

    if not processed_data:
        print("❌ Нет данных для обработки.")
        sys.exit(1)

    # Формируем содержимое JS-файла
    js_content = f"""// Данные справочника ОКПД2
// Сгенерировано автоматически из {input_file.name}
// Дата генерации: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
// Всего строк в исходнике: {line_num}
// Пропущено буквенных разделов: {skipped_sections}
// Записей в справочнике: {len(processed_data)}

const okpd2Data = {json.dumps(processed_data, ensure_ascii=False, indent=2)};
"""

    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print(f"✅ Файл создан: {output_file}")
        print(f"📏 Размер файла: {os.path.getsize(output_file) // 1024} КБ")
    except Exception as e:
        print(f"❌ Ошибка при записи: {e}")
        sys.exit(1)

    # Выводим пример для проверки
    print("\n📋 Примеры записей (первые 5):")
    for i, item in enumerate(processed_data[:5]):
        name_preview = item['name'][:60] + '...' if len(item['name']) > 60 else item['name']
        print(f"  {i+1}. [{item['section']}] {item['code']:14} -> {name_preview}")

    # Также покажем примеры записей с .000 для проверки
    print("\n🔎 Примеры записей с .000 (первые 3):")
    zero_records = [item for item in processed_data if item['code'].endswith('.000')]
    for i, item in enumerate(zero_records[:3]):
        name_preview = item['name'][:60] + '...' if len(item['name']) > 60 else item['name']
        print(f"  {item['code']:14} -> {name_preview}")

if __name__ == "__main__":
    main()