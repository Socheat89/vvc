<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Worksheet\MemoryDrawing;

class ProductController extends Controller
{
    private const EXCEL_COLUMNS = [
        'no' => ['no', 'number'],
        'image' => ['image', 'photo', 'picture'],
        'item_code' => ['itemcode', 'code', 'sku', 'productcode'],
        'local_name' => ['localname', 'khmername', 'localproductname'],
        'name' => ['name', 'itemname', 'productname'],
        'item_type' => ['itemtype', 'type'],
        'item_group' => ['itemgroup', 'group', 'category'],
        'base_unit' => ['baseunit', 'unit'],
        'alarm_qty' => ['alarmqty', 'alarmquantity', 'alertqty', 'reorderqty'],
        'public_price' => ['publicprice', 'price', 'retailprice', 'saleprice'],
        'wholesale_price' => ['wholesaleprice'],
        'partner_price' => ['partnerprice'],
        'unit_set_name' => ['unitsetname', 'unitset'],
        'memo' => ['memo', 'description', 'note', 'notes'],
        'revenue_account' => ['revenueaccount'],
        'asset' => ['asset'],
        'cogs' => ['cogs', 'costofgoodssold'],
        'on_hand' => ['onhand', 'stock', 'quantity', 'qty'],
    ];

    // GET /api/products - Public
    public function index()
    {
        $products = \Illuminate\Support\Facades\Cache::remember('products_all', 300, function () {
            return Product::with('category')->latest()->get();
        });

        return response()->json([
            'data' => $products
        ]);
    }

    // GET /api/products/{id} - Public
    public function show($id)
    {
        $product = Product::with('category')->find($id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], Response::HTTP_NOT_FOUND);
        }

        return response()->json(['data' => $product]);
    }

    // POST /api/products - Admin only
    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_code' => 'nullable|string|max:255|unique:products,item_code',
            'local_name' => 'nullable|string|max:255',
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'item_type' => 'nullable|string|max:255',
            'item_group' => 'nullable|string|max:255',
            'base_unit' => 'nullable|string|max:255',
            'alarm_qty' => 'nullable|integer|min:0',
            'price' => 'required|numeric|min:0',
            'wholesale_price' => 'nullable|numeric|min:0',
            'partner_price' => 'nullable|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'image' => 'nullable|string',
            'image_file' => 'nullable|file|mimes:jpg,jpeg,png,webp,gif,bmp,avif|max:20480',
            'unit_set_name' => 'nullable|string|max:255',
            'memo' => 'nullable|string',
            'revenue_account' => 'nullable|string|max:255',
            'asset' => 'nullable|string|max:255',
            'cogs' => 'nullable|string|max:255',
            'category_id' => 'nullable|exists:categories,id'
        ]);

        unset($validated['image_file']);

        if ($request->hasFile('image_file')) {
            $validated['image'] = $this->storeWebpImage($request->file('image_file'));
        }

        $product = Product::create($validated)->load('category');
        
        \Illuminate\Support\Facades\Cache::forget('products_all');
        \Illuminate\Support\Facades\Cache::forget('categories_all');

        return response()->json(['data' => $product], Response::HTTP_CREATED);
    }

    // PUT /api/products/{id} - Admin only
    public function update(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], Response::HTTP_NOT_FOUND);
        }

        $validated = $request->validate([
            'item_code' => 'sometimes|nullable|string|max:255|unique:products,item_code,' . $id,
            'local_name' => 'sometimes|nullable|string|max:255',
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'item_type' => 'sometimes|nullable|string|max:255',
            'item_group' => 'sometimes|nullable|string|max:255',
            'base_unit' => 'sometimes|nullable|string|max:255',
            'alarm_qty' => 'sometimes|nullable|integer|min:0',
            'price' => 'sometimes|numeric|min:0',
            'wholesale_price' => 'sometimes|nullable|numeric|min:0',
            'partner_price' => 'sometimes|nullable|numeric|min:0',
            'stock' => 'sometimes|integer|min:0',
            'image' => 'nullable|string',
            'image_file' => 'nullable|file|mimes:jpg,jpeg,png,webp,gif,bmp,avif|max:20480',
            'unit_set_name' => 'sometimes|nullable|string|max:255',
            'memo' => 'sometimes|nullable|string',
            'revenue_account' => 'sometimes|nullable|string|max:255',
            'asset' => 'sometimes|nullable|string|max:255',
            'cogs' => 'sometimes|nullable|string|max:255',
            'category_id' => 'nullable|exists:categories,id'
        ]);

        unset($validated['image_file']);

        if ($request->hasFile('image_file')) {
            $validated['image'] = $this->storeWebpImage($request->file('image_file'));
            $this->deleteLocalProductImage($product->image);
        }

        $product->update($validated);
        
        \Illuminate\Support\Facades\Cache::forget('products_all');
        \Illuminate\Support\Facades\Cache::forget('categories_all');

        return response()->json(['data' => $product->load('category')]);
    }

    // POST /api/products/import - Admin only
    public function import(Request $request)
    {
        try {
            $upload = $request->file('file') ?: collect($request->allFiles())->flatten()->first();

            if (!$upload) {
                $contentLength = (int) $request->server('CONTENT_LENGTH', 0);
                $postMaxBytes = $this->iniBytes(ini_get('post_max_size'));

                if ($contentLength > $postMaxBytes) {
                    return response()->json([
                        'message' => 'The Excel file is too large for the current PHP upload limit. Restart the backend with a larger post_max_size.',
                    ], Response::HTTP_REQUEST_ENTITY_TOO_LARGE);
                }

                return response()->json([
                    'message' => 'No Excel file was received. Please choose the file again and retry.',
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            if (!$upload->isValid()) {
                return response()->json([
                    'message' => 'Upload failed. The file may be larger than PHP allows right now. Current upload_max_filesize is ' . ini_get('upload_max_filesize') . ' and post_max_size is ' . ini_get('post_max_size') . '.',
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
                    'message' => 'Excel header row not found. Please include Item Code and Name columns.',
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            $headerMap = $this->buildHeaderMap($rows[$headerRow]);
            $embeddedImages = $this->extractImagesByRow($sheet, $headerMap['image'] ?? null);
            $created = 0;
            $updated = 0;
            $skipped = [];

            DB::transaction(function () use ($rows, $headerRow, $headerMap, $embeddedImages, &$created, &$updated, &$skipped) {
                foreach ($rows as $rowNumber => $row) {
                    if ($rowNumber <= $headerRow || !$this->rowHasValues($row)) {
                        continue;
                    }

                    $record = $this->mapRow($row, $headerMap);
                    $name = $record['name'] ?: $record['local_name'] ?: $record['item_code'];

                    if (!$name) {
                        $skipped[] = [
                            'row' => $rowNumber,
                            'reason' => 'Missing Name, Local Name, and Item Code.',
                        ];
                        continue;
                    }

                    $categoryId = $this->resolveCategoryId($record['item_group'] ?: $record['item_type']);
                    $itemCode = $record['item_code'];
                    $product = $itemCode
                        ? Product::where('item_code', $itemCode)->first()
                        : Product::where('name', $name)->first();

                    $data = [
                        'item_code' => $itemCode,
                        'local_name' => $record['local_name'],
                        'name' => $name,
                        'description' => $this->buildDescription($record, $name),
                        'item_type' => $record['item_type'],
                        'item_group' => $record['item_group'],
                        'base_unit' => $record['base_unit'],
                        'alarm_qty' => $record['alarm_qty'],
                        'price' => $record['public_price'] ?? 0,
                        'wholesale_price' => $record['wholesale_price'],
                        'partner_price' => $record['partner_price'],
                        'stock' => $record['on_hand'] ?? 0,
                        'image' => $embeddedImages[$rowNumber] ?? $record['image'],
                        'unit_set_name' => $record['unit_set_name'],
                        'memo' => $record['memo'],
                        'revenue_account' => $record['revenue_account'],
                        'asset' => $record['asset'],
                        'cogs' => $record['cogs'],
                        'category_id' => $categoryId,
                    ];

                    if ($product) {
                        $product->update($data);
                        $updated++;
                    } else {
                        Product::create($data);
                        $created++;
                    }
                }
            });

            \Illuminate\Support\Facades\Cache::forget('products_all');
            \Illuminate\Support\Facades\Cache::forget('categories_all');

            return response()->json([
                'message' => 'Products imported successfully.',
                'created' => $created,
                'updated' => $updated,
                'skipped_count' => count($skipped),
                'skipped' => array_slice($skipped, 0, 20),
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Import error: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Import failed due to server error: ' . $e->getMessage(),
                'error_detail' => [
                    'message' => $e->getMessage(),
                    'file' => basename($e->getFile()),
                    'line' => $e->getLine(),
                ]
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    // DELETE /api/products/{id} - Admin only
    public function destroy($id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], Response::HTTP_NOT_FOUND);
        }

        $this->deleteLocalProductImage($product->image);
        $product->delete();

        \Illuminate\Support\Facades\Cache::forget('products_all');
        \Illuminate\Support\Facades\Cache::forget('categories_all');

        return response()->json(['message' => 'Product deleted successfully']);
    }

    private function normalizeHeader($value): string
    {
        return preg_replace('/[^a-z0-9]+/', '', strtolower(trim((string) $value)));
    }

    private function iniBytes(string $value): int
    {
        $value = trim($value);
        $unit = strtolower(substr($value, -1));
        $bytes = (int) $value;

        return match ($unit) {
            'g' => $bytes * 1024 * 1024 * 1024,
            'm' => $bytes * 1024 * 1024,
            'k' => $bytes * 1024,
            default => $bytes,
        };
    }

    private function findHeaderRow(array $rows): ?int
    {
        foreach ($rows as $rowNumber => $row) {
            $headers = array_map(fn ($value) => $this->normalizeHeader($value), $row);

            if (in_array('itemcode', $headers, true) && in_array('name', $headers, true)) {
                return (int) $rowNumber;
            }
        }

        return null;
    }

    private function buildHeaderMap(array $headerRow): array
    {
        $normalizedHeaders = [];

        foreach ($headerRow as $column => $heading) {
            $normalizedHeaders[$column] = $this->normalizeHeader($heading);
        }

        $map = [];

        foreach (self::EXCEL_COLUMNS as $field => $aliases) {
            foreach ($normalizedHeaders as $column => $heading) {
                if (in_array($heading, $aliases, true)) {
                    $map[$field] = $column;
                    break;
                }
            }
        }

        return $map;
    }

    private function mapRow(array $row, array $headerMap): array
    {
        return [
            'image' => $this->stringValue($row, $headerMap, 'image'),
            'item_code' => $this->stringValue($row, $headerMap, 'item_code'),
            'local_name' => $this->stringValue($row, $headerMap, 'local_name'),
            'name' => $this->stringValue($row, $headerMap, 'name'),
            'item_type' => $this->stringValue($row, $headerMap, 'item_type'),
            'item_group' => $this->stringValue($row, $headerMap, 'item_group'),
            'base_unit' => $this->stringValue($row, $headerMap, 'base_unit'),
            'alarm_qty' => $this->integerValue($row, $headerMap, 'alarm_qty'),
            'public_price' => $this->decimalValue($row, $headerMap, 'public_price'),
            'wholesale_price' => $this->decimalValue($row, $headerMap, 'wholesale_price'),
            'partner_price' => $this->decimalValue($row, $headerMap, 'partner_price'),
            'unit_set_name' => $this->stringValue($row, $headerMap, 'unit_set_name'),
            'memo' => $this->stringValue($row, $headerMap, 'memo'),
            'revenue_account' => $this->stringValue($row, $headerMap, 'revenue_account'),
            'asset' => $this->stringValue($row, $headerMap, 'asset'),
            'cogs' => $this->stringValue($row, $headerMap, 'cogs'),
            'on_hand' => $this->integerValue($row, $headerMap, 'on_hand'),
        ];
    }

    private function stringValue(array $row, array $headerMap, string $field): ?string
    {
        if (!isset($headerMap[$field])) {
            return null;
        }

        $value = trim((string) ($row[$headerMap[$field]] ?? ''));

        return $value === '' ? null : $value;
    }

    private function decimalValue(array $row, array $headerMap, string $field): ?float
    {
        $value = $this->stringValue($row, $headerMap, $field);

        if ($value === null) {
            return null;
        }

        $cleaned = preg_replace('/[^\d.\-]+/', '', str_replace(',', '', $value));

        if ($cleaned === '' || $cleaned === '-' || $cleaned === '.') {
            return null;
        }

        return max(0, (float) $cleaned);
    }

    private function integerValue(array $row, array $headerMap, string $field): ?int
    {
        $value = $this->decimalValue($row, $headerMap, $field);

        return $value === null ? null : max(0, (int) round($value));
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

    private function resolveCategoryId(?string $categoryName): ?int
    {
        if (!$categoryName) {
            return null;
        }

        return Category::firstOrCreate(
            ['name' => $categoryName],
            ['description' => null]
        )->id;
    }

    private function buildDescription(array $record, string $name): string
    {
        if ($record['memo']) {
            return $record['memo'];
        }

        $details = array_filter([
            $record['local_name'] ? 'Local Name: ' . $record['local_name'] : null,
            $record['item_code'] ? 'Item Code: ' . $record['item_code'] : null,
            $record['item_type'] ? 'Item Type: ' . $record['item_type'] : null,
            $record['base_unit'] ? 'Base Unit: ' . $record['base_unit'] : null,
        ]);

        return $details ? implode("\n", $details) : $name;
    }

    private function extractImagesByRow($sheet, ?string $imageColumn): array
    {
        if (!$imageColumn) {
            return [];
        }

        $images = [];
        $directory = $this->ensureProductUploadDirectory();

        foreach ($sheet->getDrawingCollection() as $drawing) {
            [$column, $row] = Coordinate::coordinateFromString($drawing->getCoordinates());

            if ($column !== $imageColumn) {
                continue;
            }

            $savedPath = $this->saveDrawing($drawing, $directory);

            if ($savedPath) {
                $images[(int) $row] = $this->publicProductImageUrl($savedPath);
            }
        }

        return $images;
    }

    private function saveDrawing($drawing, string $directory): ?string
    {
        $baseFilename = 'product-' . Str::uuid();

        if ($drawing instanceof MemoryDrawing) {
            $path = $directory . DIRECTORY_SEPARATOR . $baseFilename . '.webp';
            if (function_exists('imagewebp') && imagewebp($drawing->getImageResource(), $path, 82)) {
                @chmod($path, 0644);
                return $path;
            }
            return null;
        }

        if ($drawing instanceof Drawing && method_exists($drawing, 'getPath')) {
            $sourcePath = $drawing->getPath();
            if (!is_file($sourcePath)) {
                return null;
            }

            // Try WebP conversion first
            $webpPath = $directory . DIRECTORY_SEPARATOR . $baseFilename . '.webp';
            if ($this->convertImagePathToWebp($sourcePath, $webpPath)) {
                @chmod($webpPath, 0644);
                return $webpPath;
            }

            // Fallback: copy original file as-is
            $extension = strtolower(pathinfo($sourcePath, PATHINFO_EXTENSION)) ?: 'jpg';
            $extension = preg_replace('/[^a-z0-9]/', '', $extension) ?: 'jpg';
            $originalPath = $directory . DIRECTORY_SEPARATOR . $baseFilename . '.' . $extension;
            if (@copy($sourcePath, $originalPath)) {
                @chmod($originalPath, 0644);
                return $originalPath;
            }
        }

        return null;
    }

    private function storeWebpImage(UploadedFile $file): string
    {
        $directory = $this->ensureProductUploadDirectory();
        $baseFilename = 'product-' . Str::uuid();

        // Try WebP conversion first
        $webpPath = $directory . DIRECTORY_SEPARATOR . $baseFilename . '.webp';
        if ($this->convertImagePathToWebp($file->getRealPath(), $webpPath)) {
            @chmod($webpPath, 0644);
            return $this->publicProductImageUrl($webpPath);
        }

        // Fallback: save original file format
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'jpg');
        $extension = preg_replace('/[^a-z0-9]/', '', $extension) ?: 'jpg';
        $imageName = $baseFilename . '.' . $extension;
        $file->move($directory, $imageName);
        $imagePath = $directory . DIRECTORY_SEPARATOR . $imageName;
        @chmod($imagePath, 0644);
        return $this->publicProductImageUrl($imagePath);
    }

    private function ensureProductUploadDirectory(): string
    {
        $directory = public_path('uploads/products');

        if (!is_dir($directory) && !@mkdir($directory, 0755, true) && !is_dir($directory)) {
            throw new \RuntimeException('Failed to create uploads/products directory.');
        }

        if (!is_writable($directory)) {
            @chmod($directory, 0775);
        }

        if (!is_writable($directory)) {
            throw new \RuntimeException('uploads/products directory is not writable.');
        }

        $testPath = $directory . DIRECTORY_SEPARATOR . '.write-test-' . uniqid('', true) . '.tmp';

        if (@file_put_contents($testPath, 'ok') === false) {
            throw new \RuntimeException('Unable to write a test file to uploads/products.');
        }

        @unlink($testPath);

        return $directory;
    }

    private function convertImagePathToWebp(string $source, string $destination): bool
    {
        $info = @getimagesize($source);

        if (!$info) {
            return false;
        }

        $image = match ($info[2]) {
            IMAGETYPE_JPEG => imagecreatefromjpeg($source),
            IMAGETYPE_PNG => imagecreatefrompng($source),
            IMAGETYPE_GIF => imagecreatefromgif($source),
            IMAGETYPE_WEBP => imagecreatefromwebp($source),
            IMAGETYPE_BMP => imagecreatefrombmp($source),
            IMAGETYPE_AVIF => function_exists('imagecreatefromavif') ? imagecreatefromavif($source) : false,
            default => false,
        };

        if (!$image) {
            return false;
        }

        imagepalettetotruecolor($image);
        imagealphablending($image, false);
        imagesavealpha($image, true);
        $saved = imagewebp($image, $destination, 82);
        imagedestroy($image);

        return $saved;
    }

    private function publicProductImageUrl(string $path): string
    {
        return url('uploads/products/' . basename($path));
    }

    private function deleteLocalProductImage(?string $imageUrl): void
    {
        if (!$imageUrl || !str_contains($imageUrl, '/uploads/products/')) {
            return;
        }

        $path = public_path('uploads/products/' . basename(parse_url($imageUrl, PHP_URL_PATH)));

        if (is_file($path)) {
            unlink($path);
        }
    }
}
