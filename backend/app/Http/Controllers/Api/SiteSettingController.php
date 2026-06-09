<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class SiteSettingController extends Controller
{
    private const DEFAULT_ABOUT_CONTENT = <<<'TEXT'
អំពីយើង (About Us)
សូមស្វាគមន៍មកកាន់ វណ្ណ វណ្ណ ខេមបូឌា!
យើងខ្ញុំគឺជាក្រុមហ៊ុនផ្គត់ផ្គង់វត្ថុធាតុដើម និងសម្ភារៈវេចខ្ចប់ឈានមុខគេ ដែលផ្តោតសំខាន់លើការបម្រើតម្រូវការដល់ម្ចាស់អាជីវកម្មហាងកាហ្វេ ហាងតែគុជ និងភេសជ្ជៈគ្រប់ប្រភេទ។ ចាប់តាំងពីឆ្នាំ ២០១៧ មក យើងបាននិងកំពុងខិតខំប្រឹងប្រែងយ៉ាងខ្លាំង ដើម្បីក្លាយជាដៃគូដ៏គួរឱ្យទុកចិត្តបំផុតសម្រាប់អតិថិជនរបស់យើង។

១. អ្វីដែលយើងផ្គត់ផ្គង់៖ យើងផ្តល់ជូននូវផលិតផលសម្បូរបែប ដែលឆ្លើយតបទៅនឹងតម្រូវការអាជីវកម្មភេសជ្ជៈរបស់អ្នករួមមាន៖
វត្ថុធាតុដើមភេសជ្ជៈ៖ តែគុជ (គុជឆ្អិនស្រាប់/ឆៅ), ទឹកស៊ីរ៉ូ (Syrup) គ្រប់រសជាតិ, និងចាហួយគ្រប់ប្រភេទដែលមានគុណភាពខ្ពស់។

សម្ភារៈវេចខ្ចប់៖ កែវផ្លាស្ទិច (ច្រើនជម្រើស ច្រើនទំហំ), ថង់យួរកែវ និងសម្ភារៈបន្ទាប់បន្សំផ្សេងៗទៀតដែលរឹងមាំ និងមានស្តង់ដារ។

២. បេសកកម្មរបស់យើង៖ បេសកកម្មចម្បងរបស់យើង គឺការផ្តល់ជូននូវ "គុណភាពល្អ តម្លៃសមរម្យ និងសេវាកម្មរហ័ស"។ យើងយល់ច្បាស់ថា គុណភាពនៃវត្ថុធាតុដើម គឺជាគន្លឹះនៃភាពជោគជ័យនៃរសជាតិភេសជ្ជៈរបស់អ្នក ខណៈដែលសម្ភារៈវេចខ្ចប់ដ៏ស្រស់ស្អាតជួយលើកកម្ពស់ស្លាកសញ្ញាហាងរបស់អ្នក។ ហេតុនេះហើយ ទើបយើងសម្រិតសម្រាំងជ្រើសរើសតែផលិតផលណាដែលល្អ និងមានសុវត្ថិភាពបំផុត។

៣. ហេតុអ្វីត្រូវជ្រើសរើស វណ្ណ វណ្ណ ខេមបូឌា?
ទំនុកចិត្តលើគុណភាព៖ រាល់ផលិតផលទាំងអស់ត្រូវបានត្រួតពិនិត្យយ៉ាងយកចិត្តទុកដាក់មុននឹងចែកចាយដល់ដៃអតិថិជន។
តម្លៃប្រកួតប្រជែង (តម្លៃបោះដុំ)៖ យើងផ្តល់ជូននូវតម្លៃបោះដុំដ៏ល្អបំផុត ដែលជួយសម្រួលដល់ម្ចាស់អាជីវកម្មក្នុងការទទួលបានប្រាក់ចំណេញខ្ពស់។
ភាពងាយស្រួល និងរហ័សទាន់ចិត្ត៖ មានសេវាកម្មដឹកជញ្ជូនរហ័ស ធានាថាទំនិញទៅដល់ទីតាំងអាជីវកម្មរបស់អ្នកទាន់ពេលវេលា និងមិនរអាក់រអួលដល់ការលក់ដូរឡើយ។

៤. ចក្ខុវិស័យរបស់យើង៖ យើងសង្ឃឹមថានឹងបានក្លាយជាកាតាលីករមួយ ក្នុងការជួយជំរុញឱ្យអាជីវកម្មភេសជ្ជៈក្នុងស្រុកកាន់តែមានភាពរីកចម្រើន និងទទួលបានជោគជ័យទាំងអស់គ្នា។ ជោគជ័យរបស់អ្នក គឺជាមោទនភាពរបស់យើង!

ទំនាក់ទំនងយើងខ្ញុំ៖ សម្រាប់ព័ត៌មានបន្ថែម ឬការបញ្ជាទិញ សូមកុំស្ទាក់ស្ទើរក្នុងការទាក់ទងមកកាន់ក្រុមការងារយើងខ្ញុំតាមរយៈ៖
លេខទូរស័ព្ទ៖ [បញ្ចូលលេខទូរស័ព្ទ]
តេឡេក្រាម (Telegram)៖ @vvc_smart ( 093 839 883 )
ទំព័រហ្វេសប៊ុក (Facebook Page)៖ [បញ្ចូលឈ្មោះ Facebook Page]
អាសយដ្ឋាន៖ [បញ្ចូលអាសយដ្ឋានក្រុមហ៊ុន ឬហាង]

[ឈ្មោះក្រុមហ៊ុនរបស់អ្នក] - ដៃគូដ៏ពិតប្រាកដសម្រាប់អាជីវកម្មភេសជ្ជៈរបស់អ្នក!
TEXT;

    private const DEFAULT_PRIVACY_CONTENT = <<<'TEXT'
គោលការណ៍ឯកជនភាព (Privacy Policy)
ក្រុមហ៊ុនយើងខ្ញុំប្តេជ្ញាការពារព័ត៌មានផ្ទាល់ខ្លួនរបស់អតិថិជនទាំងអស់។ គោលការណ៍នេះបង្ហាញពីរបៀបដែលយើងប្រមូល ប្រើប្រាស់ និងការពារទិន្នន័យរបស់អ្នកនៅពេលធ្វើការបញ្ជាទិញទំនិញពីយើងខ្ញុំ។

ការប្រមូលព័ត៌មាន៖ យើងនឹងប្រមូលព័ត៌មានចាំបាច់មួយចំនួននៅពេលអ្នកបញ្ជាទិញទំនិញ (តែគុជ កែវផ្លាស្ទិច ថង់ ស៊ីរ៉ូ ចាហួយ និងសម្ភារៈផ្សេងៗ) ដែលព័ត៌មានទាំងនោះរួមមាន៖ ឈ្មោះពេញ លេខទូរស័ព្ទ និងអាសយដ្ឋានសម្រាប់ដឹកជញ្ជូន។

គោលបំណងនៃការប្រើប្រាស់ព័ត៌មាន៖ ព័ត៌មានដែលយើងប្រមូលបាន ត្រូវបានប្រើប្រាស់សម្រាប់តែ៖
រៀបចំ និងចាត់ចែងការបញ្ជាទិញរបស់អ្នក។
សម្របសម្រួលក្នុងការដឹកជញ្ជូនទំនិញទៅដល់ទីតាំង។
ទាក់ទងផ្តល់ព័ត៌មានអំពីការបញ្ជាទិញ ឬប្រកាសអំពីផលិតផលថ្មីៗ និងការបញ្ចុះតម្លៃ។

ការចែករំលែកព័ត៌មាន៖ យើងមិនលក់ ជួល ឬចែករំលែកព័ត៌មានឯកជនរបស់អ្នកទៅកាន់តតិយជនណាមួយឡើយ។ ព័ត៌មានរបស់អ្នក (ឈ្មោះ លេខទូរស័ព្ទ អាសយដ្ឋាន) នឹងត្រូវបានផ្តល់ជូនតែភ្នាក់ងារដឹកជញ្ជូនប៉ុណ្ណោះ ដើម្បីធានាថាទំនិញត្រូវបានបញ្ជូនទៅដល់ដៃអ្នក។

ការរក្សាសុវត្ថិភាពទិន្នន័យ៖ យើងអនុវត្តវិធានការសុវត្ថិភាពយ៉ាងតឹងរ៉ឹង ដើម្បីការពារការបាត់បង់ ការប្រើប្រាស់ខុស ឬការចូលប្រើប្រាស់ទិន្នន័យរបស់អ្នកដោយគ្មានការអនុញ្ញាត។
TEXT;

    private const DEFAULT_TERMS_CONTENT = <<<'TEXT'
លក្ខខណ្ឌនៃការប្រើប្រាស់ និងការទិញលក់ (Terms of Service)
ដោយធ្វើការបញ្ជាទិញទំនិញពីក្រុមហ៊ុនយើងខ្ញុំ អ្នកយល់ព្រមគោរពតាមលក្ខខណ្ឌដូចខាងក្រោម៖

អំពីផលិតផល៖ យើងផ្គត់ផ្គង់វត្ថុធាតុដើម និងសម្ភារៈវេចខ្ចប់សម្រាប់ភេសជ្ជៈ ដូចជា តែគុជ កែវផ្លាស្ទិច ថង់ ស៊ីរ៉ូ ចាហួយ ជាដើម។ រាល់រូបភាព និងការពិពណ៌នាផលិតផលនៅលើទំព័រ ឬកាតាឡុករបស់យើងខ្ញុំ គឺសម្រាប់ជាឯកសារយោង និងអាចមានការផ្លាស់ប្តូររូបរាងវេចខ្ចប់ខ្លះៗពីក្រុមហ៊ុនផលិត។

តម្លៃ និងការទូទាត់៖ * តម្លៃទំនិញទាំងអស់អាចមានការផ្លាស់ប្តូរទៅតាមទីផ្សារជាក់ស្តែងដោយមិនចាំបាច់ជូនដំណឹងជាមុន។ ទោះយ៉ាងណា តម្លៃនៅពេលដែលអ្នកបានបញ្ជាក់ការបញ្ជាទិញរួចរាល់ នឹងមិនត្រូវបានផ្លាស់ប្តូរឡើយ។

ការទូទាត់ត្រូវធ្វើឡើងតាមរយៈ [បញ្ចូលវិធីសាស្រ្តទូទាត់: ឧទាហរណ៍ វេរប្រាក់តាមធនាគារ ឬទូទាត់សាច់ប្រាក់សុទ្ធ] នៅពេលបញ្ជាក់ការបញ្ជាទិញ ឬនៅពេលទទួលទំនិញ។

ការដឹកជញ្ជូន៖ * ការរៀបចំដឹកជញ្ជូននឹងប្រព្រឹត្តទៅបន្ទាប់ពីយើងខ្ញុំបានទទួលការបញ្ជាក់ការបញ្ជាទិញ។
ថ្លៃសេវាដឹកជញ្ជូន និងរយៈពេលនៃការដឹកជញ្ជូន គឺអាស្រ័យលើទំហំនៃការកម្ម៉ង់ និងទីតាំងរបស់អ្នក។

ការប្តូរទំនិញ និងការសងប្រាក់វិញ៖
ទំនិញដែលបានទិញហើយ មិនអាចប្តូរយកប្រាក់វិញបានឡើយ។
យើងទទួលខុសត្រូវក្នុងការប្តូរទំនិញជូនវិញ ក្នុងករណីដែលទំនិញមានការខូចខាតដោយសារកំហុសពីខាងយើងខ្ញុំ មិនត្រូវតាមការកម្ម៉ង់ ឬហួសកាលបរិច្ឆេទប្រើប្រាស់។
អតិថិជនត្រូវពិនិត្យទំនិញភ្លាមៗនៅពេលទទួលបាន និងត្រូវរាយការណ៍មកយើងខ្ញុំក្នុងរយៈពេល [បញ្ចូលចំនួនថ្ងៃ: ឧទាហរណ៍ ២៤ ម៉ោង] ប្រសិនបើមានបញ្ហា។
TEXT;

    public function show()
    {
        $settings = Cache::remember('site_settings', 300, function () {
            return $this->settings();
        });

        return response()->json(['data' => $settings]);
    }

    public function update(Request $request)
    {
        $settings = $this->settings();

        $validated = $request->validate([
            'website_name' => 'required|string|max:255',
            'logo_name' => 'nullable|string|max:255',
            'about_content' => 'nullable|string|max:30000',
            'privacy_content' => 'nullable|string|max:30000',
            'terms_content' => 'nullable|string|max:30000',
            'logo_file' => 'nullable|file|mimes:jpg,jpeg,png,webp,gif,bmp,avif|max:20480',
            'remove_logo' => 'nullable|boolean',
        ]);

        unset($validated['logo_file'], $validated['remove_logo']);

        if ($request->boolean('remove_logo')) {
            $this->deleteLocalLogo($settings->logo);
            $validated['logo'] = null;
        }

        if ($request->hasFile('logo_file')) {
            $validated['logo'] = $this->storeLogo($request->file('logo_file'));
            $this->deleteLocalLogo($settings->logo);
        }

        $settings->update($validated);
        Cache::forget('site_settings');

        return response()->json(['data' => $settings->fresh()]);
    }

    private function settings(): SiteSetting
    {
        return SiteSetting::query()->first() ?: SiteSetting::create([
            'website_name' => 'Van Van Cambodia',
            'logo_name' => 'Van Van Cambodia',
            'about_content' => self::DEFAULT_ABOUT_CONTENT,
            'privacy_content' => self::DEFAULT_PRIVACY_CONTENT,
            'terms_content' => self::DEFAULT_TERMS_CONTENT,
        ]);
    }

    private function storeLogo(UploadedFile $file): string
    {
        if (!$file->isValid()) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'Logo upload failed.');
        }

        if (!@getimagesize($file->getRealPath())) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'The selected logo is not a valid image.');
        }

        $directory = public_path('uploads/settings');

        if (!is_dir($directory) && !@mkdir($directory, 0755, true) && !is_dir($directory)) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'Unable to create uploads/settings directory.');
        }

        if (!is_writable($directory)) {
            @chmod($directory, 0775);
        }

        if (!is_writable($directory)) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'uploads/settings directory is not writable.');
        }

        $extension = strtolower($file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'png');
        $extension = preg_replace('/[^a-z0-9]/', '', $extension) ?: 'png';
        $imageName = 'site-logo-' . Str::uuid() . '.' . $extension;
        $file->move($directory, $imageName);

        $imagePath = $directory . DIRECTORY_SEPARATOR . $imageName;
        @chmod($imagePath, 0644);

        return url('uploads/settings/' . $imageName);
    }

    private function deleteLocalLogo(?string $logoUrl): void
    {
        if (!$logoUrl || strpos($logoUrl, '/uploads/settings/') === false) {
            return;
        }

        $urlPath = parse_url($logoUrl, PHP_URL_PATH) ?: $logoUrl;
        $filename = basename(str_replace('\\', '/', $urlPath));

        if (!$filename) {
            return;
        }

        $path = public_path('uploads/settings/' . $filename);

        if (is_file($path)) {
            @unlink($path);
        }
    }
}
