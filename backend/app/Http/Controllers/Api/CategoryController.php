<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;

class CategoryController extends Controller
{
    private const EXCEL_COLUMNS = [
        'name' => ['name', 'category', 'categoryname', 'category_name'],
        'description' => ['description', 'desc', 'details', 'note', 'notes'],
    ];

    // GET /api/categories - Public
    public function index()
    {
        return response()->json([
            'data' => Category::all()
        ]);
    }

    // GET /api/categories/{id} - Public
    public function show($id)
    {
        $category = Category::with('products')->find($id);

        if (!$category) {
            return response()->json(['message' => 'Category not found'], Response::HTTP_NOT_FOUND);
        }

        return response()->json(['data' => $category]);
    }

    // POST /api/categories - Admin only
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:categories|max:255',
            'description' => 'nullable|string'
        ]);

        $category = Category::create($validated);

        return response()->json(['data' => $category], Response::HTTP_CREATED);
    }

    // PUT /api/categories/{id} - Admin only
    public function update(Request $request, $id)
    {
        $category = Category::find($id);

        if (!$category) {
            return response()->json(['message' => 'Category not found'], Response::HTTP_NOT_FOUND);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|unique:categories,name,' . $id . '|max:255',
            'description' => 'nullable|string'
        ]);

        $category->update($validated);

        return response()->json(['data' => $category]);
    }

    // DELETE /api/categories/{id} - Admin only
    public function destroy($id)
    {
        $category = Category::find($id);

        if (!$category) {
            return response()->json(['message' => 'Category not found'], Response::HTTP_NOT_FOUND);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted successfully']);
    }

    // POST /api/categories/import - Admin only
    public function import(Request $request)
    {
        $upload = $request->file('file') ?: collect($request->allFiles())->flatten()->first();

        if (!$upload) {
            $contentLength = (int) $request->server('CONTENT_LENGTH', 0);
            $postMaxBytes = $this->iniBytes(ini_get('post_max_size'));

            if ($contentLength > $postMaxBytes) {
                return response()->json([
                    'message' => 'The file is too large for the current PHP upload limit. Increase post_max_size.',
                ], Response::HTTP_REQUEST_ENTITY_TOO_LARGE);
            }

            return response()->json([
                'message' => 'No file was received. Please choose the file again and retry.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (!$upload->isValid()) {
            return response()->json([
                'message' => 'Upload failed. The file may be larger than PHP allows right now.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $validator = Validator::make(['file' => $upload], [
            'file' => 'file|mimes:xlsx,xls,csv,txt|max:204800',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first('file'),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $spreadsheet = IOFactory::load($upload->getRealPath());
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray(null, true, true, true);
        $headerRow = $this->findHeaderRow($rows);

        if (!$headerRow) {
            return response()->json([
                'message' => 'Excel header row not found. Please include a Name column.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $headerMap = $this->buildHeaderMap($rows[$headerRow]);

        if (!isset($headerMap['name'])) {
            return response()->json([
                'message' => 'Name column was not detected. Please include a Name header.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $created = 0;
        $updated = 0;
        $skipped = [];

        DB::transaction(function () use ($rows, $headerRow, $headerMap, &$created, &$updated, &$skipped) {
            foreach ($rows as $rowNumber => $row) {
                if ($rowNumber <= $headerRow || !$this->rowHasValues($row)) {
                    continue;
                }

                $record = $this->mapRow($row, $headerMap);
                $name = trim((string) ($record['name'] ?? ''));

                if ($name === '') {
                    $skipped[] = [
                        'row' => $rowNumber,
                        'reason' => 'Missing category name.',
                    ];
                    continue;
                }

                $category = Category::updateOrCreate(
                    ['name' => $name],
                    ['description' => $record['description'] ?: null]
                );

                if ($category->wasRecentlyCreated) {
                    $created += 1;
                } else {
                    $updated += 1;
                }
            }
        });

        return response()->json([
            'created' => $created,
            'updated' => $updated,
            'skipped_count' => count($skipped),
            'skipped' => $skipped,
        ]);
    }

    private function findHeaderRow(array $rows): ?int
    {
        $maxRows = min(10, count($rows));

        foreach ($rows as $rowIndex => $row) {
            if ($rowIndex > $maxRows) {
                break;
            }

            foreach ($row as $value) {
                $normalized = $this->normalizeHeader($value);

                if (in_array($normalized, self::EXCEL_COLUMNS['name'], true)) {
                    return (int) $rowIndex;
                }
            }
        }

        return null;
    }

    private function buildHeaderMap(array $headerRow): array
    {
        $map = [];

        foreach ($headerRow as $column => $value) {
            $normalized = $this->normalizeHeader($value);

            foreach (self::EXCEL_COLUMNS as $field => $aliases) {
                if (in_array($normalized, $aliases, true)) {
                    $map[$field] = $column;
                    break;
                }
            }
        }

        return $map;
    }

    private function mapRow(array $row, array $headerMap): array
    {
        $record = [];

        foreach ($headerMap as $field => $column) {
            $record[$field] = isset($row[$column]) ? trim((string) $row[$column]) : null;
        }

        return $record;
    }

    private function rowHasValues(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string) $value) !== '') {
                return true;
            }
        }

        return false;
    }

    private function normalizeHeader($value): string
    {
        return strtolower(preg_replace('/[^a-z0-9]/', '', (string) $value));
    }

    private function iniBytes($value): int
    {
        $value = trim((string) $value);
        $last = strtolower($value[strlen($value) - 1]);
        $number = (int) $value;

        switch ($last) {
            case 'g':
                return $number * 1024 * 1024 * 1024;
            case 'm':
                return $number * 1024 * 1024;
            case 'k':
                return $number * 1024;
            default:
                return $number;
        }
    }
}
