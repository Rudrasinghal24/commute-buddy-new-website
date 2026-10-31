export interface DelhiPlace {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
  keywords?: string[];
  metroAccess?: boolean;
}

export const DelhiPlacesData = {
  places: [
    // Mathura & Vrindavan Local + Intercity Places
    {
      id: 'mathura_jn',
      name: 'Mathura Junction',
      area: 'Mathura Railway Station, Uttar Pradesh',
      lat: 27.4795,
      lng: 77.6736,
      keywords: ['mathura', 'mtj', 'mathura junction', 'mathura station', 'train'],
      metroAccess: false,
    },
    {
      id: 'krishna_janmabhoomi',
      name: 'Shri Krishna Janmasthan Temple',
      area: 'Janmabhoomi, Mathura, Uttar Pradesh',
      lat: 27.5048,
      lng: 77.6696,
      keywords: ['krishna janmabhoomi', 'janmasthan', 'mathura temple', 'mathura'],
      metroAccess: false,
    },
    {
      id: 'dwarkadhish_mathura',
      name: 'Shri Dwarkadhish Temple, Mathura',
      area: 'Vishram Ghat, Mathura, Uttar Pradesh',
      lat: 27.5059,
      lng: 77.6844,
      keywords: ['dwarkadhish', 'vishram ghat', 'mathura ghat', 'mathura'],
      metroAccess: false,
    },
    {
      id: 'mathura_bus_stand',
      name: 'Mathura New Bus Stand (Bhuteshwar)',
      area: 'Bhuteshwar Road, Mathura, Uttar Pradesh',
      lat: 27.4954,
      lng: 77.6632,
      keywords: ['mathura bus stand', 'bhuteshwar', 'upsrtc mathura', 'mathura'],
      metroAccess: false,
    },
    {
      id: 'govardhan_mathura',
      name: 'Govardhan Parikrama Marg',
      area: 'Govardhan, Mathura District, Uttar Pradesh',
      lat: 27.4979,
      lng: 77.4648,
      keywords: ['govardhan', 'giriraj', 'mathura', 'parikrama'],
      metroAccess: false,
    },
    {
      id: 'barsana_mathura',
      name: 'Shri Radha Rani Temple, Barsana',
      area: 'Barsana, Mathura District, Uttar Pradesh',
      lat: 27.6476,
      lng: 77.3768,
      keywords: ['barsana', 'radha rani temple', 'mathura'],
      metroAccess: false,
    },
    {
      id: 'gla_university_mathura',
      name: 'GLA University, Mathura',
      area: 'NH-19, Chaumuhan, Mathura, Uttar Pradesh',
      lat: 27.6057,
      lng: 77.5933,
      keywords: ['gla', 'gla university', 'chaumuhan', 'mathura college'],
      metroAccess: false,
    },
    {
      id: 'mathura_refinery',
      name: 'Mathura Refinery Township',
      area: 'NH-19, Aurangabad, Mathura, Uttar Pradesh',
      lat: 27.4112,
      lng: 77.7195,
      keywords: ['mathura refinery', 'iocl mathura', 'refinery nagar'],
      metroAccess: false,
    },
    {
      id: 'vrindavan_banke_bihari',
      name: 'Vrindavan Banke Bihari Temple',
      area: 'Goda Vihar, Vrindavan, Mathura, Uttar Pradesh',
      lat: 27.5806,
      lng: 77.6997,
      keywords: ['vrindavan', 'banke bihari', 'mathura vrindavan'],
      metroAccess: false,
    },
    {
      id: 'prem_mandir_vrindavan',
      name: 'Prem Mandir, Vrindavan',
      area: 'Chhatikara Road, Vrindavan, Mathura, Uttar Pradesh',
      lat: 27.572,
      lng: 77.6718,
      keywords: ['prem mandir', 'vrindavan', 'iskcon vrindavan', 'chhatikara'],
      metroAccess: false,
    },

    // Residential & Sub-city NCR Places
    {
      id: 'prateek_grand_city',
      name: 'Prateek Grand City, Siddharth Vihar',
      area: 'Siddharth Vihar, Ghaziabad, Uttar Pradesh',
      lat: 28.6512,
      lng: 77.4165,
      keywords: ['prateek grand city', 'siddharth vihar', 'ghaziabad', 'indirapuram', 'nh24'],
      metroAccess: false,
    },
    {
      id: 'shaheed_sthal_metro',
      name: 'Shaheed Sthal (New Bus Adda) Metro',
      area: 'Red Line Terminal, Ghaziabad, Uttar Pradesh',
      lat: 28.6706,
      lng: 77.4158,
      keywords: ['shaheed sthal', 'new bus adda', 'ghaziabad metro', 'red line'],
      metroAccess: true,
    },
    {
      id: 'vaishali_metro',
      name: 'Vaishali Metro Station',
      area: 'Blue Line Branch, Ghaziabad, Uttar Pradesh',
      lat: 28.6499,
      lng: 77.3396,
      keywords: ['vaishali', 'indirapuram', 'ghaziabad', 'blue line'],
      metroAccess: true,
    },
    {
      id: 'gaur_city_noida_ext',
      name: 'Gaur City Chowk, Greater Noida West',
      area: 'Noida Extension, Gautam Buddha Nagar, UP',
      lat: 28.6096,
      lng: 77.4279,
      keywords: ['gaur city', 'noida extension', 'greater noida west', 'char murti'],
      metroAccess: false,
    },
    {
      id: 'pari_chowk_greater_noida',
      name: 'Pari Chowk, Greater Noida',
      area: 'Aqua Line Metro, Greater Noida, UP',
      lat: 28.4671,
      lng: 77.5138,
      keywords: ['pari chowk', 'greater noida', 'aqua line', 'knowledge park'],
      metroAccess: true,
    },

    // Delhi-NCR Core Hubs
    {
      id: 'rajiv_chowk',
      name: 'Rajiv Chowk (Connaught Place)',
      area: 'Connaught Place, Central Delhi',
      lat: 28.6328,
      lng: 77.2197,
      keywords: ['cp', 'connaught place', 'central delhi', 'yellow line', 'blue line', 'delhi'],
      metroAccess: true,
    },
    {
      id: 'kashmere_gate',
      name: 'Kashmere Gate ISBT',
      area: 'Inter State Bus Terminus, North Delhi',
      lat: 28.6675,
      lng: 77.2282,
      keywords: ['isbt', 'bus terminal', 'red line', 'violet line', 'old delhi'],
      metroAccess: true,
    },
    {
      id: 'hauz_khas',
      name: 'Hauz Khas',
      area: 'Outer Ring Road, South Delhi',
      lat: 28.5433,
      lng: 77.2066,
      keywords: ['iit', 'south delhi', 'magenta line', 'yellow line', 'hkv'],
      metroAccess: true,
    },
    {
      id: 'new_delhi_station',
      name: 'New Delhi Railway Station',
      area: 'Paharganj / Ajmeri Gate, Central Delhi',
      lat: 28.6429,
      lng: 77.2191,
      keywords: ['ndls', 'train', 'railway', 'airport express', 'paharganj'],
      metroAccess: true,
    },
    {
      id: 'hazrat_nizamuddin',
      name: 'Hazrat Nizamuddin Railway Station',
      area: 'Sarai Kale Khan, South East Delhi',
      lat: 28.5877,
      lng: 77.2518,
      keywords: ['nzm', 'nizamuddin', 'sarai kale khan', 'pink line', 'train'],
      metroAccess: true,
    },
    {
      id: 'igi_airport_t3',
      name: 'IGI Airport (Terminal 3)',
      area: 'Indira Gandhi International Airport, New Delhi',
      lat: 28.5562,
      lng: 77.1,
      keywords: ['airport', 't3', 'flight', 'orange line', 'igi', 'delhi airport'],
      metroAccess: true,
    },
    {
      id: 'cyber_city',
      name: 'DLF Cyber City',
      area: 'DLF Phase 2, Gurugram, Haryana',
      lat: 28.495,
      lng: 77.0895,
      keywords: ['gurgaon', 'gurugram', 'cyberhub', 'office', 'rapid metro'],
      metroAccess: true,
    },
    {
      id: 'noida_sec_62',
      name: 'Noida Sector 62',
      area: 'Electronic City, Noida, Uttar Pradesh',
      lat: 28.6277,
      lng: 77.3649,
      keywords: ['noida', 'electronic city', 'blue line', 'sector 62', 'up'],
      metroAccess: true,
    },
    {
      id: 'india_gate',
      name: 'India Gate',
      area: 'Kartavya Path, Central Delhi',
      lat: 28.6129,
      lng: 77.2295,
      keywords: ['kartavya path', 'rajpath', 'central secretariat', 'monument'],
      metroAccess: true,
    },
    {
      id: 'chandni_chowk',
      name: 'Chandni Chowk',
      area: 'Old Delhi (Purani Dilli)',
      lat: 28.6562,
      lng: 77.2303,
      keywords: ['red fort', 'lal qila', 'old delhi', 'jama masjid', 'market'],
      metroAccess: true,
    },
    {
      id: 'dwarka_sec_21',
      name: 'Dwarka Sector 21',
      area: 'Dwarka Sub City, South West Delhi',
      lat: 28.5522,
      lng: 77.0583,
      keywords: ['dwarka', 'blue line', 'airport express', 'west delhi'],
      metroAccess: true,
    },
    {
      id: 'lajpat_nagar',
      name: 'Lajpat Nagar',
      area: 'Central Market, South Delhi',
      lat: 28.5697,
      lng: 77.2433,
      keywords: ['pink line', 'violet line', 'market', 'south delhi'],
      metroAccess: true,
    },
    {
      id: 'anand_vihar',
      name: 'Anand Vihar ISBT',
      area: 'Trans-Yamuna, East Delhi',
      lat: 28.6469,
      lng: 77.316,
      keywords: ['east delhi', 'isbt', 'rrts', 'railway', 'pink line', 'blue line'],
      metroAccess: true,
    },
    {
      id: 'karol_bagh',
      name: 'Karol Bagh',
      area: 'Ajmal Khan Road, Central West Delhi',
      lat: 28.6441,
      lng: 77.1885,
      keywords: ['market', 'blue line', 'pusa road', 'rajendra place'],
      metroAccess: true,
    },
    {
      id: 'saket',
      name: 'Saket (Select Citywalk)',
      area: 'Press Enclave Marg, South Delhi',
      lat: 28.5246,
      lng: 77.2066,
      keywords: ['mall', 'select citywalk', 'malviya nagar', 'yellow line'],
      metroAccess: true,
    },
    {
      id: 'nehru_place',
      name: 'Nehru Place',
      area: 'Outer Ring Road, South Delhi',
      lat: 28.5494,
      lng: 77.2519,
      keywords: ['it market', 'kalkaji', 'violet line', 'lotus temple'],
      metroAccess: true,
    },
    {
      id: 'rohini_sec_18',
      name: 'Rohini Sector 18',
      area: 'Bawana Road, North West Delhi',
      lat: 28.7383,
      lng: 77.1408,
      keywords: ['rohini', 'pitampura', 'yellow line', 'north delhi'],
      metroAccess: true,
    },
    {
      id: 'janakpuri_west',
      name: 'Janakpuri West',
      area: 'District Centre, West Delhi',
      lat: 28.6294,
      lng: 77.0776,
      keywords: ['west delhi', 'magenta line', 'blue line', 'uttam nagar'],
      metroAccess: true,
    },
    {
      id: 'botanical_garden',
      name: 'Botanical Garden',
      area: 'Sector 38A, Noida, Uttar Pradesh',
      lat: 28.5641,
      lng: 77.3343,
      keywords: ['noida', 'sector 18', 'magenta line', 'blue line', 'kalindi kunj'],
      metroAccess: true,
    },
    {
      id: 'aiims_delhi',
      name: 'AIIMS / INA',
      area: 'Aurobindo Marg, South Delhi',
      lat: 28.5689,
      lng: 77.21,
      keywords: ['hospital', 'safdarjung', 'ina', 'dilli haat', 'yellow line', 'pink line'],
      metroAccess: true,
    },
    {
      id: 'huda_city_centre',
      name: 'Millennium City Centre Gurugram',
      area: 'Sector 29, Gurugram, Haryana',
      lat: 28.4593,
      lng: 77.0724,
      keywords: ['huda city centre', 'gurgaon', 'gurugram', 'yellow line', 'sector 29'],
      metroAccess: true,
    },
    {
      id: 'iit_delhi',
      name: 'IIT Delhi',
      area: 'Hauz Khas, Outer Ring Road, South Delhi',
      lat: 28.5457,
      lng: 77.1928,
      keywords: ['iit', 'college', 'magenta line', 'munirka', 'jnu'],
      metroAccess: true,
    },
    {
      id: 'akshardham',
      name: 'Akshardham',
      area: 'NH-24, Pandav Nagar, East Delhi',
      lat: 28.6127,
      lng: 77.2773,
      keywords: ['temple', 'mayur vihar', 'blue line', 'yamuna'],
      metroAccess: true,
    },
    {
      id: 'qutub_minar',
      name: 'Qutub Minar',
      area: 'Mehrauli, South Delhi',
      lat: 28.5245,
      lng: 77.1855,
      keywords: ['mehrauli', 'monument', 'yellow line', 'chhatarpur'],
      metroAccess: true,
    },
    {
      id: 'vasant_kunj',
      name: 'Vasant Kunj (Ambience Mall)',
      area: 'Nelson Mandela Marg, South West Delhi',
      lat: 28.5402,
      lng: 77.1558,
      keywords: ['jnu', 'ambience mall', 'mahipalpur', 'south west delhi'],
      metroAccess: false,
    },
    {
      id: 'north_campus_du',
      name: 'Vishwavidyalaya (DU North Campus)',
      area: 'Mall Road, Civil Lines, North Delhi',
      lat: 28.6955,
      lng: 77.2144,
      keywords: ['du', 'delhi university', 'kamla nagar', 'gtb nagar', 'yellow line'],
      metroAccess: true,
    },
    {
      id: 'faridabad_old',
      name: 'Old Faridabad',
      area: 'Mathura Road, Faridabad, Haryana',
      lat: 28.4112,
      lng: 77.3132,
      keywords: ['faridabad', 'violet line', 'badarpur', 'haryana'],
      metroAccess: true,
    },

    // Major Pan-India Cities & Transit Hubs
    {
      id: 'agra_cantt',
      name: 'Agra Cantt / Taj Mahal',
      area: 'Agra, Uttar Pradesh',
      lat: 27.1578,
      lng: 78.0081,
      keywords: ['agra', 'taj mahal', 'agc', 'gatimaan', 'yamuna expressway'],
      metroAccess: true,
    },
    {
      id: 'jaipur_junction',
      name: 'Jaipur Junction (Sindhi Camp)',
      area: 'MI Road, Jaipur, Rajasthan',
      lat: 26.9196,
      lng: 75.7878,
      keywords: ['jaipur', 'pink city', 'rajasthan', 'sindhi camp', 'hawa mahal'],
      metroAccess: true,
    },
    {
      id: 'lucknow_charbagh',
      name: 'Lucknow Charbagh (Hazratganj)',
      area: 'Charbagh, Lucknow, Uttar Pradesh',
      lat: 26.8317,
      lng: 80.9191,
      keywords: ['lucknow', 'lko', 'charbagh', 'hazratganj', 'gomti nagar'],
      metroAccess: true,
    },
    {
      id: 'kanpur_central',
      name: 'Kanpur Central (IIT Kanpur)',
      area: 'Kanpur, Uttar Pradesh',
      lat: 26.4539,
      lng: 80.3512,
      keywords: ['kanpur', 'cnb', 'iit kanpur', 'up'],
      metroAccess: true,
    },
    {
      id: 'varanasi_junction',
      name: 'Varanasi Junction (Kashi Vishwanath)',
      area: 'Cantt / Godowlia, Varanasi, Uttar Pradesh',
      lat: 25.327,
      lng: 82.986,
      keywords: ['varanasi', 'banaras', 'kashi', 'bsb', 'assy ghat'],
      metroAccess: false,
    },
    {
      id: 'prayagraj_junction',
      name: 'Prayagraj Junction (Civil Lines)',
      area: 'Prayagraj (Allahabad), Uttar Pradesh',
      lat: 25.4448,
      lng: 81.8291,
      keywords: ['prayagraj', 'allahabad', 'sangam', 'civil lines'],
      metroAccess: false,
    },
    {
      id: 'dehradun_isbt',
      name: 'Dehradun Railway Station / ISBT',
      area: 'Paltan Bazaar, Dehradun, Uttarakhand',
      lat: 30.3165,
      lng: 78.0322,
      keywords: ['dehradun', 'uttarakhand', 'mussoorie', 'ddn'],
      metroAccess: false,
    },
    {
      id: 'haridwar_junction',
      name: 'Haridwar Junction (Har Ki Pauri)',
      area: 'Station Road, Haridwar, Uttarakhand',
      lat: 29.9457,
      lng: 78.1642,
      keywords: ['haridwar', 'rishikesh', 'har ki pauri', 'uttarakhand'],
      metroAccess: false,
    },
    {
      id: 'chandigarh_isbt17',
      name: 'Chandigarh Sector 17 / Railway Station',
      area: 'Sector 17, Chandigarh',
      lat: 30.7415,
      lng: 76.7821,
      keywords: ['chandigarh', 'mohali', 'panchkula', 'cdg', 'punjab'],
      metroAccess: false,
    },
    {
      id: 'amritsar_golden_temple',
      name: 'Amritsar Junction (Golden Temple)',
      area: 'Hall Bazar, Amritsar, Punjab',
      lat: 31.634,
      lng: 74.8723,
      keywords: ['amritsar', 'golden temple', 'harmandir sahib', 'punjab'],
      metroAccess: false,
    },
    {
      id: 'mumbai_csmt',
      name: 'Mumbai CSMT (Nariman Point)',
      area: 'Fort, South Mumbai, Maharashtra',
      lat: 18.9398,
      lng: 72.8355,
      keywords: ['mumbai', 'csmt', 'vt', 'churchgate', 'marine drive', 'maharashtra'],
      metroAccess: true,
    },
    {
      id: 'mumbai_bkc_andheri',
      name: 'Mumbai Andheri / BKC / Airport',
      area: 'Andheri East / Bandra Kurla Complex, Mumbai',
      lat: 19.1136,
      lng: 72.8697,
      keywords: ['andheri', 'bkc', 'bandra', 'mumbai airport', 'bom', 'dadar'],
      metroAccess: true,
    },
    {
      id: 'pune_junction',
      name: 'Pune Junction (Shivajinagar / Hinjewadi)',
      area: 'Station Road, Pune, Maharashtra',
      lat: 18.5289,
      lng: 73.8744,
      keywords: ['pune', 'hinjewadi', 'shivajinagar', 'maharashtra'],
      metroAccess: true,
    },
    {
      id: 'ahmedabad_kalupur',
      name: 'Ahmedabad Junction (Sabarmati / SG Highway)',
      area: 'Kalupur, Ahmedabad, Gujarat',
      lat: 23.0268,
      lng: 72.6009,
      keywords: ['ahmedabad', 'amdavad', 'gujarat', 'sabarmati', 'gandhinagar'],
      metroAccess: true,
    },
    {
      id: 'bengaluru_majestic',
      name: 'Bengaluru Majestic (KSR / MG Road)',
      area: 'Kempegowda Bus Station, Bengaluru, Karnataka',
      lat: 12.9767,
      lng: 77.5713,
      keywords: ['bangalore', 'bengaluru', 'majestic', 'mg road', 'indiranagar', 'namma metro'],
      metroAccess: true,
    },
    {
      id: 'bengaluru_whitefield',
      name: 'Bengaluru Whitefield / Electronic City',
      area: 'ITPL Main Road, Whitefield, Bengaluru',
      lat: 12.9698,
      lng: 77.75,
      keywords: ['whitefield', 'electronic city', 'silk board', 'koramangala', 'blr'],
      metroAccess: true,
    },
    {
      id: 'hyderabad_hitec',
      name: 'Hyderabad HITEC City / Secunderabad',
      area: 'Madhapur, Hyderabad, Telangana',
      lat: 17.4474,
      lng: 78.3762,
      keywords: ['hyderabad', 'hitec city', 'secunderabad', 'gachibowli', 'telangana'],
      metroAccess: true,
    },
    {
      id: 'chennai_central',
      name: 'Chennai Central (MGR Central / T. Nagar)',
      area: 'Park Town, Chennai, Tamil Nadu',
      lat: 13.0827,
      lng: 80.2707,
      keywords: ['chennai', 'madras', 'mgr central', 'egmore', 'tamil nadu'],
      metroAccess: true,
    },
    {
      id: 'kolkata_howrah',
      name: 'Kolkata Howrah / Esplanade (Park Street)',
      area: 'Howrah / Esplanade, Kolkata, West Bengal',
      lat: 22.5839,
      lng: 88.3426,
      keywords: ['kolkata', 'calcutta', 'howrah', 'sealdah', 'park street', 'salt lake'],
      metroAccess: true,
    },
    {
      id: 'bhopal_rkmp',
      name: 'Bhopal Rani Kamlapati (Habibganj)',
      area: 'MP Nagar, Bhopal, Madhya Pradesh',
      lat: 23.2215,
      lng: 77.4384,
      keywords: ['bhopal', 'habibganj', 'rani kamlapati', 'mp'],
      metroAccess: true,
    },
    {
      id: 'indore_rajwada',
      name: 'Indore Junction (Rajwada / Vijay Nagar)',
      area: 'Chhoti Gwaltoli, Indore, Madhya Pradesh',
      lat: 22.7196,
      lng: 75.8577,
      keywords: ['indore', 'rajwada', 'vijay nagar', 'mp'],
      metroAccess: true,
    },
    {
      id: 'patna_junction',
      name: 'Patna Junction (Gandhi Maidan)',
      area: 'Fraser Road, Patna, Bihar',
      lat: 25.6033,
      lng: 85.1376,
      keywords: ['patna', 'bihar', 'danapur', 'gandhi maidan'],
      metroAccess: false,
    },
    {
      id: 'kochi_ernakulam',
      name: 'Kochi Ernakulam Junction (MG Road)',
      area: 'Ernakulam South, Kochi, Kerala',
      lat: 9.969,
      lng: 76.2909,
      keywords: ['kochi', 'cochin', 'ernakulam', 'kerala', 'kochi metro'],
      metroAccess: true,
    },
  ] as DelhiPlace[],

  computeDeterministicCoordOffset(rawText: string): [number, number] {
    let hash = 0;
    const normalized = rawText.trim().toLowerCase();
    for (let i = 0; i < normalized.length; i++) {
      hash = (hash * 31 + normalized.charCodeAt(i)) | 0;
    }
    const latOffset = (((hash & 0xffff) % 400) - 200) / 10000.0;
    const lngOffset = ((((hash >>> 16) & 0xffff) % 400) - 200) / 10000.0;
    return [
      Math.abs(latOffset) < 0.002 ? 0.0065 : latOffset,
      Math.abs(lngOffset) < 0.002 ? -0.0065 : lngOffset,
    ];
  },

  searchPlaces(query: string): DelhiPlace[] {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return this.places.slice(0, 5);
    }

    const tokens = trimmed
      .split(/[\s,\-/()]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2);

    const exactMatches = this.places.filter(
      (place) =>
        place.name.toLowerCase().includes(trimmed) ||
        place.area.toLowerCase().includes(trimmed) ||
        (place.keywords ?? []).some((kw) => kw.toLowerCase().includes(trimmed))
    );

    const tokenMatches =
      exactMatches.length > 0
        ? exactMatches
        : this.places.filter((place) =>
            tokens.some(
              (tok) =>
                place.name.toLowerCase().includes(tok) ||
                place.area.toLowerCase().includes(tok) ||
                (place.keywords ?? []).some((kw) => kw.toLowerCase().includes(tok))
            )
          );

    const anchorPlace = tokenMatches[0] ?? null;
    const cleanTitle = query.trim();

    if (
      tokenMatches.length > 0 &&
      tokenMatches.some(
        (p) =>
          p.name.toLowerCase() === trimmed ||
          p.name.toLowerCase().startsWith(trimmed)
      )
    ) {
      return tokenMatches.slice(0, 5);
    }

    const [dLat, dLng] = this.computeDeterministicCoordOffset(cleanTitle);
    const customPlace: DelhiPlace = anchorPlace
      ? {
          id: `custom_${trimmed.replace(/\s+/g, '_')}`,
          name: cleanTitle,
          area: `Near ${anchorPlace.area}`,
          lat: anchorPlace.lat + dLat,
          lng: anchorPlace.lng + dLng,
          keywords: [trimmed],
          metroAccess: anchorPlace.metroAccess,
        }
      : {
          id: `custom_${trimmed.replace(/\s+/g, '_')}`,
          name: cleanTitle,
          area: 'Custom Location, India',
          lat: 28.6139 + dLat * 3,
          lng: 77.209 + dLng * 3,
          keywords: [trimmed],
          metroAccess: false,
        };

    return [customPlace, ...tokenMatches].slice(0, 5);
  },

  async resolveAccuratePlace(place: DelhiPlace): Promise<DelhiPlace> {
    if (!place.id.startsWith('custom_')) return place;
    const geocoded = await this.fetchPlacesFromBackend(place.name);
    const best = geocoded.find((p) => !p.id.startsWith('custom_'));
    if (!best) return place;
    return {
      ...best,
      name: place.name,
    };
  },

  isMetroAvailableRegion(area: string, lat: number, lng: number): boolean {
    const lower = area.toLowerCase();
    const metroCities = [
      'delhi',
      'new delhi',
      'noida',
      'greater noida',
      'gurugram',
      'gurgaon',
      'ghaziabad',
      'faridabad',
      'mumbai',
      'bengaluru',
      'bangalore',
      'hyderabad',
      'chennai',
      'kolkata',
      'jaipur',
      'lucknow',
      'kanpur',
      'agra',
      'pune',
      'ahmedabad',
      'nagpur',
      'kochi',
      'indore',
      'bhopal',
    ];
    if (metroCities.some((c) => lower.includes(c))) return true;
    const inNcrBox = lat >= 28.35 && lat <= 28.85 && lng >= 76.9 && lng <= 77.6;
    return inNcrBox;
  },

  async queryArcGisGeocoder(query: string): Promise<DelhiPlace[]> {
    try {
      const encoded = encodeURIComponent(query);
      const url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine=${encoded}&countryCode=IND&maxLocations=6&outFields=PlaceName,Place_addr,City,Subregion,Region&f=json`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const root = await res.json();
      const candidates = root.candidates;
      if (!Array.isArray(candidates)) return [];
      const results: DelhiPlace[] = [];
      for (let i = 0; i < candidates.length; i++) {
        const item = candidates[i];
        const loc = item?.location;
        const attrs = item?.attributes ?? {};
        const lat = Number(loc?.y);
        const lng = Number(loc?.x);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        const rawAddr = String(attrs.Place_addr || item.address || '').trim();
        const placeName = String(attrs.PlaceName || '').trim();
        const parts = rawAddr
          .split(',')
          .map((p: string) => p.trim())
          .filter(Boolean);
        const primary = placeName || parts[0] || query;
        const area =
          parts.length > 1 ? parts.slice(1, 4).join(', ') : rawAddr || 'India';
        results.push({
          id: `arcgis_${i}_${Math.abs((primary + area).length)}`,
          name: primary,
          area,
          lat,
          lng,
          keywords: [query.toLowerCase()],
          metroAccess: this.isMetroAvailableRegion(`${primary} ${area}`, lat, lng),
        });
      }
      return results;
    } catch {
      return [];
    }
  },

  async queryNominatimGeocoder(query: string): Promise<DelhiPlace[]> {
    try {
      const encoded = encodeURIComponent(query);
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=in&q=${encoded}`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en-IN,en;q=0.9' },
      });
      if (!res.ok) return [];
      const arr = await res.json();
      if (!Array.isArray(arr)) return [];
      const results: DelhiPlace[] = [];
      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const displayName = String(item.display_name || '');
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || !displayName) continue;
        const parts = displayName
          .split(',')
          .map((p: string) => p.trim())
          .filter(Boolean);
        const primary = parts[0] || query;
        const area =
          parts.length > 1 ? parts.slice(1, 4).join(', ') : 'India';
        results.push({
          id: `osm_${item.place_id ?? i}`,
          name: primary,
          area,
          lat,
          lng,
          keywords: [query.toLowerCase()],
          metroAccess: this.isMetroAvailableRegion(displayName, lat, lng),
        });
      }
      return results;
    } catch {
      return [];
    }
  },

  async queryPhotonGeocoder(query: string): Promise<DelhiPlace[]> {
    try {
      const encoded = encodeURIComponent(`${query} India`);
      const url = `https://photon.komoot.io/api/?q=${encoded}&limit=6&lang=en`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const root = await res.json();
      const features = root.features;
      if (!Array.isArray(features)) return [];
      const results: DelhiPlace[] = [];
      for (let i = 0; i < features.length; i++) {
        const feat = features[i];
        const coords = feat?.geometry?.coordinates;
        const props = feat?.properties ?? {};
        if (!Array.isArray(coords) || coords.length < 2) continue;
        const lng = Number(coords[0]);
        const lat = Number(coords[1]);
        const country = String(props.country || '');
        if (country && !country.toLowerCase().includes('india')) continue;
        const name = String(
          props.name || props.street || props.district || query
        ).trim();
        const city = String(props.city || props.county || '').trim();
        const state = String(props.state || '').trim();
        const area =
          [ props.district, city, state ].filter(Boolean).join(', ') || 'India';
        results.push({
          id: `photon_${i}_${Math.round(lat * 1000)}`,
          name,
          area,
          lat,
          lng,
          keywords: [query.toLowerCase()],
          metroAccess: this.isMetroAvailableRegion(`${name} ${area}`, lat, lng),
        });
      }
      return results;
    } catch {
      return [];
    }
  },

  async queryOpenMeteoGeocoder(query: string): Promise<DelhiPlace[]> {
    try {
      const encoded = encodeURIComponent(query);
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encoded}&count=5&language=en&format=json`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const root = await res.json();
      const arr = root.results;
      if (!Array.isArray(arr)) return [];
      const results: DelhiPlace[] = [];
      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        const countryCode = String(item.country_code || '');
        if (countryCode && countryCode.toUpperCase() !== 'IN') continue;
        const lat = Number(item.latitude);
        const lng = Number(item.longitude);
        const name = String(item.name || query);
        const admin1 = String(item.admin1 || '');
        const admin2 = String(item.admin2 || '');
        const area = [admin2, admin1, 'India'].filter(Boolean).join(', ');
        results.push({
          id: `meteo_${item.id ?? i}`,
          name,
          area,
          lat,
          lng,
          keywords: [query.toLowerCase()],
          metroAccess: this.isMetroAvailableRegion(`${name} ${area}`, lat, lng),
        });
      }
      return results;
    } catch {
      return [];
    }
  },

  async fetchPlacesFromBackend(query: string): Promise<DelhiPlace[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return this.places.slice(0, 5);
    }

    const localExactMatches = this.places.filter(
      (place) =>
        place.name.toLowerCase().includes(trimmed.toLowerCase()) ||
        place.area.toLowerCase().includes(trimmed.toLowerCase()) ||
        (place.keywords ?? []).some((kw) =>
          kw.toLowerCase().includes(trimmed.toLowerCase())
        )
    );

    try {
      const [arcgisList, nominatimList, photonList, meteoList] = await Promise.all([
        this.queryArcGisGeocoder(trimmed),
        this.queryNominatimGeocoder(trimmed),
        this.queryPhotonGeocoder(trimmed),
        this.queryOpenMeteoGeocoder(trimmed),
      ]);

      const combined: DelhiPlace[] = [
        ...localExactMatches,
        ...arcgisList,
        ...nominatimList,
        ...photonList,
        ...meteoList,
      ];

      const deduplicated: DelhiPlace[] = [];
      for (const candidate of combined) {
        const isDuplicate = deduplicated.some(
          (existing) =>
            existing.name.toLowerCase() === candidate.name.toLowerCase() &&
            this.haversineMeters(
              existing.lat,
              existing.lng,
              candidate.lat,
              candidate.lng
            ) < 600
        );
        if (!isDuplicate) {
          deduplicated.push(candidate);
        }
      }

      if (deduplicated.length > 0) {
        return deduplicated.slice(0, 5);
      }
    } catch {
      // Fallback below
    }

    return this.searchPlaces(trimmed);
  },

  async reverseGeocodeFromBackend(lat: number, lng: number): Promise<DelhiPlace> {
    let nearest = this.places[0];
    let minDistance = Number.MAX_VALUE;
    for (const p of this.places) {
      const d = this.haversineMeters(lat, lng, p.lat, p.lng);
      if (d < minDistance) {
        minDistance = d;
        nearest = p;
      }
    }
    if (minDistance <= 1800) {
      return nearest;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en-IN,en;q=0.9' },
      });
      if (res.ok) {
        const json = await res.json();
        const displayName = String(json.display_name || '');
        if (displayName) {
          const parts = displayName
            .split(',')
            .map((p: string) => p.trim())
            .filter(Boolean);
          const primary = parts[0] || 'Current Location';
          const area =
            parts.length > 1 ? parts.slice(1, 4).join(', ') : 'GPS Location';
          return {
            id: `gps_${Math.round(lat * 10000)}_${Math.round(lng * 10000)}`,
            name: primary,
            area,
            lat,
            lng,
            keywords: ['gps', 'current location'],
            metroAccess: this.isMetroAvailableRegion(displayName, lat, lng),
          };
        }
      }
    } catch {
      // Ignore network failure and return nearest
    }

    return nearest;
  },

  haversineMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const r = 6371000.0;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return r * c;
  },
};
