import { db } from './db.ts';

export function seedInitialData(): void {
  const existingCatCount = (db.prepare(`SELECT COUNT(*) as cnt FROM categories`).get() as { cnt: number }).cnt;
  if (existingCatCount === 0) {
    const insertCat = db.prepare(`
      INSERT INTO categories (slug, name_en, name_hi, description_en, description_hi, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertCat.run(
      'documentaries',
      'Documentaries',
      'डॉक्यूमेंट्री',
      'Long-form 2D-animated research documentaries examining civilization, history, and global shifts.',
      'सभ्यता, इतिहास और वैश्विक बदलावों की गहन पड़ताल करने वाली लंबी 2D एनिमेटेड डॉक्यूमेंट्री।',
      1
    );
    insertCat.run(
      'mysteries',
      'Mysteries',
      'रहस्य',
      'Unexplained archaeological anomalies, vanished civilizations, and archival enigmas.',
      'अनसुलझे पुरातात्विक रहस्य, लुप्त सभ्यताएँ और ऐतिहासिक पहेलियाँ।',
      2
    );
    insertCat.run(
      'real-stories',
      'Real Stories',
      'सच्ची कहानियाँ',
      'Verified real-world events, economic turning points, and documented human narratives.',
      'तथ्यों पर आधारित वास्तविक घटनाएँ, आर्थिक मोड़ और प्रमाणित मानवीय कहानियाँ।',
      3
    );
    insertCat.run(
      'historical-discoveries',
      'Historical Discoveries',
      'ऐतिहासिक खोजें',
      'Excavations, sunken cities, ancient engineering, and newly uncovered archaeological evidence.',
      'खुदाई, डूबे हुए शहर, प्राचीन इंजीनियरिंग और नए पुरातात्विक प्रमाण।',
      4
    );
  }

  const catRows = db.prepare(`SELECT id, slug FROM categories`).all() as Array<{ id: number; slug: string }>;
  const catBySlug = Object.fromEntries(catRows.map((c) => [c.slug, c.id]));

  const existingVideoCount = (db.prepare(`SELECT COUNT(*) as cnt FROM videos`).get() as { cnt: number }).cnt;
  if (existingVideoCount === 0) {
    const insertVideo = db.prepare(`
      INSERT INTO videos (
        slug, youtube_url, youtube_id, format,
        title_en, title_hi, description_en, description_hi,
        category_id, status, is_featured, is_trending, is_demo, display_order, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Verified public long-form documentaries from https://www.youtube.com/@anidocemedia
    insertVideo.run(
      'mahabalipuram-sunken-temples-tsunami-discovery',
      'https://www.youtube.com/watch?v=D5txajr7GK8',
      'D5txajr7GK8',
      'long',
      'When the Tsunami Receded: The 1,400-Year-Old Secret of Mahabalipuram',
      'सुनामी का पानी हटा तो बाहर आया 1400 साल पुराना सच!',
      'During the December 2004 Indian Ocean tsunami, receding waters along the Tamil Nadu coast briefly exposed submerged granite structures off Mahabalipuram. This 2D documentary examines coastal archaeology, Pallava-era records, and underwater survey evidence.',
      '26 दिसंबर 2004 की सुनामी के दौरान जब तमिलनाडु के महाबलीपुरम तट से समुद्र का पानी पीछे हटा, तो सदियों पुरानी डूबी हुई पत्थर की संरचनाएँ दिखाई दीं। यह डॉक्यूमेंट्री तटीय पुरातत्व और ऐतिहासिक प्रमाणों की पड़ताल करती है।',
      catBySlug['historical-discoveries'] ?? catBySlug['documentaries'],
      'published',
      1,
      1,
      0,
      1,
      '2026-11-10T11:16:02+00:00'
    );

    insertVideo.run(
      'sinauli-4000-year-old-chariot-excavation',
      'https://www.youtube.com/watch?v=zdm_Dv7_MdM',
      'zdm_Dv7_MdM',
      'long',
      'Whose 4,000-Year-Old Chariot Was It? The Sinauli Excavation Mystery',
      '4000 साल पुराना रथ आखिर किसका था? | सिनौली का रहस्य',
      'Archaeological excavations at Sinauli in Uttar Pradesh uncovered copper-inlaid wooden chariots, burial chambers, and weaponry dating back roughly 4,000 years. Explore what the ASI findings reveal about Bronze Age South Asia.',
      'उत्तर प्रदेश के सिनौली में हुई पुरातात्विक खुदाई में तांबे से जड़े 4,000 साल पुराने रथ, कब्रें और हथियार मिले। जानिए एएसआई की खोजें कांस्य युग के भारत के बारे में क्या बताती हैं।',
      catBySlug['historical-discoveries'] ?? catBySlug['mysteries'],
      'published',
      0,
      1,
      0,
      2,
      '2026-10-18T10:00:00+00:00'
    );

    insertVideo.run(
      'rakhigarhi-5000-year-old-harappan-discovery',
      'https://www.youtube.com/watch?v=iCdy-Ot2VXI',
      'iCdy-Ot2VXI',
      'long',
      'What Was Found in Rakhigarhi? 5,000-Year-Old Harappan Civilization Mystery',
      'राखीगढ़ी में 5000 साल पुराना क्या मिला? | Rakhigarhi Mystery & Harappan Civilization',
      'Spanning hundreds of hectares in Haryana, Rakhigarhi is one of the largest Harappan settlements ever excavated. This documentary traces urban planning, craft workshops, and ancient DNA research from the site.',
      'हरियाणा के राखीगढ़ी में स्थित 5,000 साल पुरानी हड़प्पा बस्ती भारत की सबसे बड़ी प्राचीन सभ्यताओं में से एक है। यह वीडियो वहाँ की नगर योजना और पुरातात्विक खोजों को समझाता है।',
      catBySlug['historical-discoveries'] ?? catBySlug['documentaries'],
      'published',
      0,
      1,
      0,
      3,
      '2026-10-12T10:00:00+00:00'
    );

    insertVideo.run(
      'japan-economic-miracle-to-lost-decades',
      'https://www.youtube.com/watch?v=GqEaYYK8YQs',
      'GqEaYYK8YQs',
      'long',
      'From Japan’s Economic Miracle to Stagnation: Why Did a Rich Nation Slow Down?',
      'Japan की Economic Miracle से गिरावट तक | जापान अमीर देश होकर भी क्यों धीमा पड़ा?',
      'A research-based real story examining post-war Japanese industrial growth, the late-1980s asset bubble, monetary policy shifts, and demographic pressures that reshaped the world’s third-largest economy.',
      'जापान के युद्धोत्तर आर्थिक चमत्कार, 1980 के दशक के एसेट बबल और जनसांख्यिकीय चुनौतियों पर आधारित एक शोधपरक सच्ची कहानी।',
      catBySlug['real-stories'] ?? catBySlug['documentaries'],
      'published',
      0,
      1,
      0,
      4,
      '2026-10-15T10:00:00+00:00'
    );

    insertVideo.run(
      'indus-valley-abandoned-cities-5000-years-ago',
      'https://www.youtube.com/watch?v=hSRYuM08kTc',
      'hSRYuM08kTc',
      'long',
      'Why Did Great Cities of the Indus Civilization Empty 5,000 Years Ago?',
      '5000 साल पहले एक महान सभ्यता के शहर खाली क्यों होने लगे? | सिंधु सभ्यता का रहस्य',
      'Climate shifts, river course migrations, and changing trade networks all feature in modern investigations into why major Harappan urban centers gradually declined.',
      'जलवायु परिवर्तन, नदियों के मार्ग में बदलाव और व्यापार तंत्र के बदलने से सिंधु घाटी सभ्यता के बड़े शहर क्यों खाली होने लगे, इस पर आधारित रहस्य डॉक्यूमेंट्री।',
      catBySlug['mysteries'] ?? catBySlug['documentaries'],
      'published',
      0,
      0,
      0,
      5,
      '2026-10-08T10:00:00+00:00'
    );

    insertVideo.run(
      'dwarka-submerged-city-marine-mystery',
      'https://www.youtube.com/watch?v=Hxpsb3A3Xbw',
      'Hxpsb3A3Xbw',
      'long',
      'How Did Dwarka Submerge? The Underwater Mystery off Gujarat’s Coast',
      'द्वारका कैसे डूबी? श्रीकृष्ण की नगरी का समुद्र में छिपा रहस्य',
      'Marine archaeological expeditions off the coast of Dwarka documented submerged stone walls, anchors, and coastal sea-level history. This episode separates verified underwater findings from myth.',
      'गुजरात के द्वारका तट के नीचे समुद्री पुरातत्व अभियानों में मिली पत्थर की संरचनाओं और समुद्र तल के बदलावों की वैज्ञानिक और ऐतिहासिक पड़ताल।',
      catBySlug['mysteries'] ?? catBySlug['historical-discoveries'],
      'published',
      0,
      1,
      0,
      6,
      '2026-10-02T10:00:00+00:00'
    );

    // Verified public Shorts from https://www.youtube.com/@anidocemedia/shorts
    const shortsSeed = [
      {
        slug: 'short-tapti-river-1000-year-old-temple',
        id: 'RcHIRE8wis0',
        title_hi: 'ताप्ती नदी के नीचे मिला 1000 साल पुराना मंदिर!',
        title_en: '1,000-Year-Old Temple Emerges Beneath the Tapti River',
        desc_hi: 'गर्मियों में जब ताप्ती नदी का जलस्तर कम होता है, तो पानी के भीतर से प्राचीन नक्काशीदार पत्थर और खंभे दिखाई देते हैं।',
        desc_en: 'When seasonal water levels drop along the Tapti River, carved stone pillars of an ancient submerged shrine surface.',
        cat: 'historical-discoveries',
        pub: '2026-11-15T03:22:19+00:00',
      },
      {
        slug: 'short-1825-night-1500-people-mystery',
        id: 'ur_rw3IVSY8',
        title_hi: '1825 की उस रात 1500 लोगों के साथ क्या हुआ था?',
        title_en: 'What Happened to 1,500 People on That Night in 1825?',
        desc_hi: '1825 की एक रहस्यमयी ऐतिहासिक घटना की संक्षिप्त पड़ताल।',
        desc_en: 'A concise archival look at an eerie historical event from 1825.',
        cat: 'mysteries',
        pub: '2026-11-13T07:22:49+00:00',
      },
      {
        slug: 'short-mahabalipuram-sunken-city',
        id: 'm8_RIFY3IH4',
        title_hi: 'महाबलीपुरम का डूबा हुआ शहर | समुद्र में छिपा रहस्य',
        title_en: 'The Sunken City of Mahabalipuram Beneath the Sea',
        desc_hi: 'तमिलनाडु के महाबलीपुरम के समुद्र तट से जुड़ी प्राचीन संरचनाओं की झलक।',
        desc_en: 'A quick look at the submerged coastal structures off Mahabalipuram, Tamil Nadu.',
        cat: 'historical-discoveries',
        pub: '2026-11-11T04:06:13+00:00',
      },
      {
        slug: 'short-delhi-air-pollution-missing-readings-2026',
        id: 'TtIoSttcjEE',
        title_hi: 'दिवाली के बाद दिल्ली की हवा में क्या हुआ? 148 रीडिंग्स गायब!',
        title_en: 'Delhi Pollution Monitoring Mystery: 148 Missing PM2.5 Readings',
        desc_hi: 'सीपीसीबी मॉनिटरिंग स्टेशनों की जाँच में 148 पीएम2.5 रीडिंग्स गायब मिलने पर एक संक्षिप्त रिपोर्ट।',
        desc_en: 'A 30-second breakdown of missing PM2.5 air quality readings across Delhi monitoring stations.',
        cat: 'real-stories',
        pub: '2026-11-09T14:24:35+00:00',
      },
      {
        slug: 'short-golconda-fort-underground-chamber',
        id: 'eduzrpMinXc',
        title_hi: 'गोलकुंडा किले के नीचे मिला रहस्यमयी कमरा! ASI की जाँच में क्या निकला?',
        title_en: 'Hidden Chamber Under Golconda Fort: What Did the ASI Find?',
        desc_hi: 'हैदराबाद के ऐतिहासिक गोलकुंडा किले के पास जमीन के नीचे मिली ग्रेनाइट संरचना की एएसआई जांच।',
        desc_en: 'ASI inspection of a subterranean granite structure discovered near Hyderabad’s Golconda Fort.',
        cat: 'historical-discoveries',
        pub: '2026-11-07T03:12:40+00:00',
      },
      {
        slug: 'short-ujjain-vaishya-tekri-stupa',
        id: 'VjVQ7bWINKg',
        title_hi: 'उज्जैन की वैश्य टेकरी का रहस्य! सांची से भी बड़ा बौद्ध स्तूप?',
        title_en: 'Mystery of Ujjain’s Vaishya Tekri: Larger Than Sanchi Stupa?',
        desc_hi: '1938–39 की पुरातात्विक खुदाई में उज्जैन की वैश्य टेकरी से मिले विशाल स्तूप के अवशेष।',
        desc_en: 'Archaeological excavations at Ujjain’s Vaishya Tekri mound dating back to 1938–39.',
        cat: 'historical-discoveries',
        pub: '2026-11-05T02:03:32+00:00',
      },
      {
        slug: 'short-dholavira-ancient-water-engineering',
        id: 'qL2-PN9Xzd4',
        title_hi: '4,000 साल पहले पानी कैसे बचाते थे? धोलावीरा का रहस्य',
        title_en: 'How Dholavira Stored Water 4,000 Years Ago',
        desc_hi: 'गुजरात के प्राचीन धोलावीरा शहर में मिले विशाल जलाशय और हड़प्पा सभ्यता की जल-प्रबंधन तकनीक।',
        desc_en: 'Ancient rainwater reservoirs and hydraulic engineering uncovered at Dholavira in Gujarat.',
        cat: 'historical-discoveries',
        pub: '2026-10-26T14:48:26+00:00',
      },
      {
        slug: 'short-silverpit-crater-north-sea',
        id: '9mmCJzwfwic',
        title_hi: 'समुद्र के नीचे मिला 3.2 KM का रहस्यमयी गड्ढा! | Silverpit Crater',
        title_en: 'Silverpit Crater: The 3.2 KM Mystery Beneath the North Sea',
        desc_hi: 'उत्तरी सागर के नीचे छिपे सिल्वरपिट क्रेटर और उल्कापिंड की टक्कर के वैज्ञानिक प्रमाण।',
        desc_en: 'Geological evidence behind the 3.2-kilometer Silverpit Crater beneath the North Sea.',
        cat: 'mysteries',
        pub: '2026-10-22T11:42:08+00:00',
      },
    ];

    shortsSeed.forEach((s, index) => {
      insertVideo.run(
        s.slug,
        `https://www.youtube.com/shorts/${s.id}`,
        s.id,
        'short',
        s.title_en,
        s.title_hi,
        s.desc_en,
        s.desc_hi,
        catBySlug[s.cat] ?? catBySlug['documentaries'],
        'published',
        0,
        index < 2 ? 1 : 0,
        0,
        10 + index,
        s.pub
      );
    });

    // Clearly labeled DEMO records so the Owner can inspect and bulk-delete demo data
    insertVideo.run(
      'demo-sample-maritime-archive-entry',
      '',
      '',
      'long',
      '[DEMO] Sample Documentary Slot: Maritime Trade Cartography',
      '[डेमो] नमूना डॉक्यूमेंट्री: समुद्री व्यापार मानचित्रण',
      'This is a clearly marked DEMO placeholder entry created for layout testing. It contains no external YouTube video ID and can be permanently removed using "Select all demo records" in the Owner Dashboard.',
      'यह लेआउट परीक्षण के लिए बनाया गया एक स्पष्ट डेमो रिकॉर्ड है। आप इसे ओनर डैशबोर्ड से एक साथ चुनकर स्थायी रूप से हटा सकते हैं।',
      catBySlug['documentaries'],
      'published',
      0,
      0,
      1,
      100,
      null
    );

    insertVideo.run(
      'demo-sample-unpublished-draft',
      '',
      '',
      'long',
      '[DEMO] Sample Draft Entry: Himalayan Pass Expedition Notes',
      '[डेमो] नमूना ड्राफ्ट: हिमालयी दर्रा अभियान नोट्स',
      'This is a clearly marked DEMO draft entry. Because its status is Draft, it remains hidden from public visitors and visible only inside the private Owner Dashboard.',
      'यह एक डेमो ड्राफ्ट रिकॉर्ड है जो सार्वजनिक वेबसाइट पर छिपा रहता है और केवल निजी ओनर डैशबोर्ड में दिखाई देता है।',
      catBySlug['mysteries'],
      'draft',
      0,
      0,
      1,
      101,
      null
    );
  }

  const existingSectionCount = (db.prepare(`SELECT COUNT(*) as cnt FROM homepage_sections`).get() as { cnt: number }).cnt;
  if (existingSectionCount === 0) {
    const insertSection = db.prepare(`
      INSERT INTO homepage_sections (section_key, title_en, title_hi, subtitle_en, subtitle_hi, cta_label_en, cta_label_hi, is_visible, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertSection.run(
      'hero',
      'Research-Driven 2D Documentaries',
      'शोध पर आधारित 2D डॉक्यूमेंट्री',
      'Investigating historical discoveries, unsolved mysteries, and documented real stories with archival clarity.',
      'ऐतिहासिक खोजों, अनसुलझे रहस्यों और प्रमाणित सच्ची कहानियों की गहन और सटीक प्रस्तुति।',
      'Watch Featured Documentary',
      'फ़ीचर्ड डॉक्यूमेंट्री देखें',
      1,
      1
    );
    insertSection.run(
      'featured',
      'Featured Investigation',
      'मुख्य विशेष प्रस्तुति',
      'Spotlight documentary selected by the editorial desk.',
      'संपादकीय डेस्क द्वारा चुनी गई विशेष डॉक्यूमेंट्री।',
      'Watch Full Episode',
      'पूरा एपिसोड देखें',
      1,
      2
    );
    insertSection.run(
      'latest',
      'Latest Releases',
      'नवीनतम डॉक्यूमेंट्री',
      'Recently published long-form episodes from the ANIDOC 2D archive.',
      'ANIDOC 2D संग्रह से हाल ही में प्रकाशित लंबी डॉक्यूमेंट्री।',
      'Browse All Documentaries',
      'सभी डॉक्यूमेंट्री देखें',
      1,
      3
    );
    insertSection.run(
      'trending',
      'Trending Documentaries',
      'लोकप्रिय डॉक्यूमेंट्री',
      'Curated episodes drawing sustained reader and viewer inquiry.',
      'दर्शकों द्वारा सर्वाधिक देखे और सराहे गए विषय।',
      'Explore Archive',
      'संग्रह देखें',
      1,
      4
    );
    insertSection.run(
      'mysteries',
      'Mystery Collection',
      'रहस्य संग्रह',
      'Submerged ruins, vanished cities, and unexplained records.',
      'डूबे हुए अवशेष, लुप्त नगर और अनसुलझे ऐतिहासिक प्रमाण।',
      'View All Mysteries',
      'सभी रहस्य देखें',
      1,
      5
    );
    insertSection.run(
      'real_stories',
      'Real Stories',
      'सच्ची कहानियाँ',
      'Verified economic, civic, and historical turning points.',
      'प्रमाणित आर्थिक, सामाजिक और ऐतिहासिक घटनाओं का विश्लेषण।',
      'View Real Stories',
      'सच्ची कहानियाँ देखें',
      1,
      6
    );
    insertSection.run(
      'historical',
      'Historical Discoveries',
      'ऐतिहासिक खोजें',
      'Excavations and archaeological evidence across South Asia and beyond.',
      'भारत और विश्व भर की प्रमुख पुरातात्विक खुदाइयाँ और खोजें।',
      'Explore Discoveries',
      'खोजें देखें',
      1,
      7
    );
    insertSection.run(
      'shorts',
      'ANIDOC 2D Shorts',
      'ANIDOC 2D शॉर्ट्स',
      'Focused 60-second visual dispatches from history and science.',
      'इतिहास और विज्ञान से जुड़े संक्षिप्त 60-सेकंड के वीडियो।',
      'Open Shorts Feed',
      'सभी शॉर्ट्स देखें',
      1,
      8
    );
    insertSection.run(
      'about',
      'Inside the Editorial Studio',
      'संपादकीय स्टूडियो के बारे में',
      'How ANIDOC 2D pairs primary archival research with crafted 2D animation.',
      'जानिए ANIDOC 2D किस प्रकार प्रामाणिक शोध को 2D एनिमेशन के साथ प्रस्तुत करता है।',
      'Read About ANIDOC 2D',
      'हमारे बारे में पढ़ें',
      1,
      9
    );
  }

  const defaultSettings: Record<string, string> = {
    site_name: 'ANIDOC 2D',
    youtube_channel_url: 'https://youtube.com/@anidocemedia?si=rcoYZaWMGqJ7c7na',
    default_language: 'en',
    default_theme: 'dark',
    seo_title_en: 'ANIDOC 2D — Documentaries, Mysteries & Real Stories',
    seo_title_hi: 'ANIDOC 2D — डॉक्यूमेंट्री, रहस्य और सच्ची कहानियाँ',
    seo_description_en:
      'Explore cinematic 2D-animated documentaries, historical discoveries, unsolved mysteries, and research-based real stories on ANIDOC 2D.',
    seo_description_hi:
      'ANIDOC 2D पर ऐतिहासिक खोजों, अनसुलझे रहस्यों और शोध-आधारित सच्ची कहानियों पर बनी 2D एनिमेटेड डॉक्यूमेंट्री देखें।',
    seo_keywords: 'ANIDOC 2D, 2D documentary, Indian history, archaeology, mysteries, real stories, Hindi documentary',
    canonical_base_url: '',
    about_en:
      'ANIDOC 2D is an independent editorial documentary platform dedicated to historical discoveries, unexplained mysteries, and verified real-world stories. Every episode combines archival research, archaeological and civic records, and clean 2D visual storytelling designed for curious audiences in both Hindi and English.',
    about_hi:
      'ANIDOC 2D एक स्वतंत्र संपादकीय डॉक्यूमेंट्री मंच है जो ऐतिहासिक खोजों, अनसुलझे रहस्यों और प्रमाणित सच्ची कहानियों को प्रस्तुत करता है। प्रत्येक प्रस्तुति में प्राथमिक स्रोतों, पुरातात्विक अभिलेखों और स्पष्ट 2D दृश्य कहानी कहने की कला को हिंदी और अंग्रेज़ी दोनों भाषाओं में संजोया जाता है।',
    privacy_en:
      'ANIDOC 2D respects visitor privacy. We store visitor theme and language preferences locally in your browser so your reading experience remains consistent. Messages submitted through our Contact page are stored securely on our server solely to review and respond to your inquiry. Embedded YouTube players follow YouTube privacy-enhanced mode (youtube-nocookie.com) where supported. We do not sell personal data or run invasive third-party ad trackers.',
    privacy_hi:
      'ANIDOC 2D आपकी गोपनीयता का सम्मान करता है। आपकी भाषा और थीम की पसंद केवल आपके ब्राउज़र में सहेजी जाती है। संपर्क फ़ॉर्म के माध्यम से भेजे गए संदेश केवल आपके प्रश्न का उत्तर देने के लिए सुरक्षित रूप से सर्वर पर संग्रहीत किए जाते हैं। यूट्यूब वीडियो प्लेयर यथासंभव प्राइवेसी-एन्हांस्ड मोड (youtube-nocookie.com) का उपयोग करते हैं। हम व्यक्तिगत डेटा नहीं बेचते।',
    terms_en:
      'All editorial summaries, bilingual metadata, and custom visual branding on ANIDOC 2D are provided for educational and informational viewing. Embedded videos remain hosted on YouTube and are subject to YouTube Terms of Service. Unauthorized scraping, automated administrative probing, or misrepresentation of ANIDOC 2D content is prohibited.',
    terms_hi:
      'ANIDOC 2D पर प्रकाशित सभी संपादकीय विवरण और द्विभाषी सामग्री शैक्षिक एवं सूचनात्मक उद्देश्य से प्रस्तुत की जाती है। एम्बेड किए गए वीडियो यूट्यूब पर होस्ट किए गए हैं और यूट्यूब की सेवा शर्तों के अधीन हैं। अनधिकृत डेटा संग्रह या प्रशासनिक प्रणाली में हस्तक्षेप निषिद्ध है।',
    contact_email: 'editorial@anidoc2d.example',
    public_contact_name: 'Aryan Dangi',
    public_contact_mobile: '7389020530',
    show_public_contact: '1',
  };

  const insertSetting = db.prepare(`INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)`);
  for (const [key, value] of Object.entries(defaultSettings)) {
    insertSetting.run(key, value);
  }
}
