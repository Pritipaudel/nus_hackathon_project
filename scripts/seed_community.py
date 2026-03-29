"""Seed community groups and posts into the database.

Run from project root:
    uv run python scripts/seed_community.py

Note: Requires users to be seeded first (seed_users.py).

Language notes on posts:
  - Kathmandu Valley posts: Nepal Bhasa (Newari) — marked [NEWARI] where translation needed
  - Madhesh / Terai posts: Maithili or Bhojpuri — marked [MAITHILI] / [BHOJPURI]
  - Himalayan / Bhotia posts: marked [BHOTIA/TIBETAN] — translate as appropriate
  - Other posts: Nepali or English — no translation needed
"""

from __future__ import annotations

import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from dataclasses import dataclass

from sqlalchemy.orm import Session

from backend.core.database import SessionLocal
import backend.models.community  # noqa: F401
from backend.models.community import (
    CommunityGroup,
    CommunityGroupType,
    CommunityPost,
    CommunityCategory,
)
from backend.models.user import User


@dataclass(frozen=True)
class SeedGroup:
    name: str
    group_type: str
    value: str
    description: str


@dataclass(frozen=True)
class SeedPost:
    author_email: str
    content: str
    category: str
    group_value: str  # matches SeedGroup.value to look up the group


# ---------------------------------------------------------------------------
# GROUPS
# Religion-based groups removed. Groups are now regional, ethnicity/caste,
# gender, and thematic. CUSTOM type is used for regional groups (no REGIONAL
# type exists in the CommunityGroupType enum).
# ---------------------------------------------------------------------------

SEED_GROUPS: list[SeedGroup] = [

    # ── Regional (CUSTOM type) ────────────────────────────────────────────────

    SeedGroup(
        name="काठमाडौँ उपत्यका समूह",           # Kathmandu Valley Community
        group_type=CommunityGroupType.CUSTOM,
        value="Kathmandu-Valley",
        description=(
            "येँ, यल व ख्वप—काठमाडौँ उपत्यकामा बस्ने सबैका लागि एउटा साझा चौतारी। यहाँ सहरको प्रदुषण (pollution stress), आवासको दबाब (housing pressure), कोलाहल (noise), र 'city life' को भागदौडले निम्त्याउने मानसिक स्वास्थ्यका चुनौतीहरूका बारेमा 'discuss' गरिन्छ। नेवाःत, पिनेपाखें वयाच्वंपिं (migrants), र यो उपत्यकालाई आफ्नो घर मान्ने सबैका लागि थ्व 'Open' दु।"
        ),
    ),
    SeedGroup(
        name="मधेस-तराई समूह",                # Madhesh-Terai Community
        group_type=CommunityGroupType.CUSTOM,
        value="Madhesh-Terai",
        description=(
            "मधेश प्रदेश आ तराईक मैदानी क्षेत्रक समुदाय लेल—मैथिली, भोजपुरी, अवधी आ थारु बजैत लोक सभक लेल एकटा सहयोगक स्थान। एतय क्षेत्रीय पहिचान, बाढ़ि सँ विस्थापन, अत्यधिक गर्मीक तनाव (heat stress), आ नेपालक दक्षिणी भेग मे मानसिक स्वास्थ्य सेवासभक पहुँच पर चर्चा कएल जाइत अछि।"
        ),
    ),
    SeedGroup(
        name="हिमाल-भोटिया समूह",                 # Himalayan / Bhotia Community
        group_type=CommunityGroupType.CUSTOM,
        value="Himal-Bhotia",
        description=(
            "ནེ་པལ་གྱི་རི་མཐོ་ས་ཧི་མ་ལ་ཡའི་རྒྱུད་དུ་བཞུགས་མཁན་རྣམས་ཀྱི་ཚོགས་པ། འདིའི་ནང་མུ་སྟང་དང་། དོལ་པོ། ཧཱུྃ་ལ། མ་ནང་། ཤར་ཁུམ་བུ་བཅས་ཀྱི་མི་རྣམས་ཡོད། བྷོ་ཊི་ཡ་དང་། ཤར་པ། ལྷོ་མི། བོད་རིགས་བཅས་ཀྱི་མི་སེར་རྣམས་ལ་དགའ་བསུ་ཞུ་རྒྱུ་ཡིན། ས་ཆ་མཐོ་སའི་དཀའ་ངལ་དང་། ཁེར་རྐྱང་དུ་ལུས་པ། རི་མཐོ་སའི་འཚོ་བའི་དཀའ་ངལ་རྣམས་ཀྱི་སྐོར་ལ་རོགས་རམ་དང་ཁ་བརྡ་བྱེད་པའི་ས་ཆ་ཞིག་ཡིན།"
        ),
    ),
    SeedGroup(
        name="कोशी प्रदेश समूह",                # Koshi Province Community
        group_type=CommunityGroupType.CUSTOM,
        value="Koshi-Province",
        description=(
            "कोशी प्रदेशका बासिन्दाहरूका लागि यो एउटा क्षेत्रीय समुदाय हो—जसमा धनकुटा, ताप्लेजुङ, इलाम, संखुवासभा, तेह्रथुम र आसपासका जिल्लाहरू समेटिएका छन्। यो पूर्वी नेपालका राई, लिम्बु, शेर्पा, याख्खा र तामाङ समुदायहरूको एउटा साझा चौतारी हो।"
        ),
    ),
    SeedGroup(
        name="गण्डकी प्रदेश समूह",              # Gandaki Province Community
        group_type=CommunityGroupType.CUSTOM,
        value="Gandaki-Province",
        description=(
            "Community for residents of Gandaki Province — Pokhara, Kaski, Lamjung, "
            "Gorkha, Manang, Mustang, and surrounding districts. A mix of hill "
            "communities, Gurung, Magar, and Thakali peoples navigating tourism "
            "economy pressures, migration, and mountain living."
        ),
    ),
    SeedGroup(
        name="लुम्बिनी-राप्ती समूह",                # Lumbini / Rapti Region Community
        group_type=CommunityGroupType.CUSTOM,
        value="Lumbini-Rapti",
        description=(
            "Support community for people from Lumbini Province and the Rapti corridor "
            "— Butwal, Rupandehi, Kapilvastu, Dang, Rolpa, Pyuthan. Covers Tharu, "
            "Magar, and Awadhi communities alongside hill migrants and border-town "
            "residents."
        ),
    ),
    SeedGroup(
        name="कर्णाली समूह ",                      # Karnali Community
        group_type=CommunityGroupType.CUSTOM,
        value="Karnali",
        description=(
            "कर्णाली प्रदेशका मानसका लागि यो एउटा साझा चौतारी हो। नेपालको सबैभन्दा विकट थलो, जसमा जुम्ला, कालिकोट, मुगु, डोल्पा, हुम्ला र सुर्खेत जिल्लाहरू भित्तर पर्छन्। अनिकालको पीर (food insecurity stress), विकट भूगोलको बास, ओखती-मूलोको असाजिलो (limited healthcare), र कर्णालीका मानसको साहस र जिमरी (resilience) का बारेमा यहाँ कुरा गरिन्छ।"
        ),
    ),
    SeedGroup(
        name="सुदूरपश्चिम समूह",                 # Far-Western Community
        group_type=CommunityGroupType.CUSTOM,
        value="Sudurpaschim",
        description=(
            "Regional space for communities of Sudurpashchim Province — Dhangadhi, "
            "Kanchanpur, Dadeldhura, Baitadi, Bajhang, and Darchula. Home to Doteli, "
            "Acchami, and Tharu communities facing unique challenges including historical "
            "conflict trauma and migration pressures."
        ),
    ),

    # ── Ethnicity / Caste ────────────────────────────────────────────────────

    SeedGroup(
        name="Janajati Samuha",
        group_type=CommunityGroupType.ETHNICITY_CASTE,
        value="Janajati",
        description=(
            "Support network for Nepal's indigenous nationalities — Tamang, Gurung, "
            "Magar, Newar, Sherpa, Rai, Limbu, Tharu and others. A space to discuss "
            "identity, cultural preservation, and mental wellbeing."
        ),
    ),
    SeedGroup(
        name="Dalit Samuha",
        group_type=CommunityGroupType.ETHNICITY_CASTE,
        value="Dalit",
        description=(
            "A supportive community for Dalit individuals across Nepal dealing with "
            "discrimination, stigma, and the mental health impact of caste-based "
            "exclusion. A space for solidarity, healing, and advocacy."
        ),
    ),
    SeedGroup(
        name="Brahmin-Chhetri Samuha",
        group_type=CommunityGroupType.ETHNICITY_CASTE,
        value="Brahmin-Chhetri",
        description=(
            "A space to openly discuss mental health within Brahmin and Chhetri "
            "communities — including family expectations, academic pressure, caste "
            "obligations, and the stress of upholding social status."
        ),
    ),

    # ── Nepal identity (ethnicity / religion / city) — extended catalogue ────

    SeedGroup(
        name="Bhote Community",
        group_type=CommunityGroupType.ETHNICITY_CASTE,
        value="Bhote",
        description="Community for the Bhote people from northern Nepal",
    ),
    SeedGroup(
        name="Rai Community",
        group_type=CommunityGroupType.ETHNICITY_CASTE,
        value="Rai",
        description="Community for the Rai ethnic group in eastern Nepal",
    ),
    SeedGroup(
        name="Limbu Community",
        group_type=CommunityGroupType.ETHNICITY_CASTE,
        value="Limbu",
        description="Community for the Limbu people of eastern Nepal",
    ),
    SeedGroup(
        name="Sherpa Community",
        group_type=CommunityGroupType.ETHNICITY_CASTE,
        value="Sherpa",
        description=(
            "Community for Sherpa ethnic group members from Solukhumbu and surrounding areas"
        ),
    ),
    SeedGroup(
        name="Gurung Community",
        group_type=CommunityGroupType.ETHNICITY_CASTE,
        value="Gurung",
        description="Community for Gurung people from central Nepal",
    ),
    SeedGroup(
        name="Magar Community",
        group_type=CommunityGroupType.ETHNICITY_CASTE,
        value="Magar",
        description="Community for the Magar ethnic group of western and central Nepal",
    ),
    SeedGroup(
        name="Tamang Community",
        group_type=CommunityGroupType.ETHNICITY_CASTE,
        value="Tamang",
        description="Community for celebrating Tamang cultural traditions in central Nepal",
    ),
    SeedGroup(
        name="Thakali Community",
        group_type=CommunityGroupType.ETHNICITY_CASTE,
        value="Thakali",
        description="Community of Thakali people from Mustang region",
    ),
    SeedGroup(
        name="Sunuwar Community",
        group_type=CommunityGroupType.ETHNICITY_CASTE,
        value="Sunuwar",
        description="Community for the Sunuwar ethnic group of eastern Nepal",
    ),
    SeedGroup(
        name="Yolmo Community",
        group_type=CommunityGroupType.ETHNICITY_CASTE,
        value="Yolmo",
        description="Community for Yolmo (Helambu Sherpa) people from northern Nepal",
    ),
    SeedGroup(
        name="Newar Community",
        group_type=CommunityGroupType.ETHNICITY_CASTE,
        value="Newar",
        description="Community celebrating Newar cultural heritage",
    ),
    SeedGroup(
        name="Hindu Community",
        group_type=CommunityGroupType.RELIGION,
        value="Hindu",
        description="Community for followers of Hinduism",
    ),
    SeedGroup(
        name="Buddhist Community",
        group_type=CommunityGroupType.RELIGION,
        value="Buddhism",
        description="Community for followers of Buddhism",
    ),
    SeedGroup(
        name="Christian Community",
        group_type=CommunityGroupType.RELIGION,
        value="Christianity",
        description="Community for followers of Christianity",
    ),
    SeedGroup(
        name="Women Support Group",
        group_type=CommunityGroupType.GENDER,
        value="Female",
        description="Community for women to discuss empowerment and social issues",
    ),
    SeedGroup(
        name="Men Support Group",
        group_type=CommunityGroupType.GENDER,
        value="Male",
        description="Community for men to discuss health, career, and social issues",
    ),
    SeedGroup(
        name="Kathmandu Residents",
        group_type=CommunityGroupType.CUSTOM,
        value="Kathmandu",
        description="Community for people living in Kathmandu",
    ),
    SeedGroup(
        name="Pokhara Residents",
        group_type=CommunityGroupType.CUSTOM,
        value="Pokhara",
        description="Community for people living in Pokhara",
    ),

    # ── City & province residents (CUSTOM) — additional discoverable groups ─

    SeedGroup(
        name="Biratnagar Residents",
        group_type=CommunityGroupType.CUSTOM,
        value="Biratnagar",
        description="Community for people living in Biratnagar",
    ),
    SeedGroup(
        name="Dharan Residents",
        group_type=CommunityGroupType.CUSTOM,
        value="Dharan",
        description="Community for people living in Dharan",
    ),
    SeedGroup(
        name="Nepalgunj Residents",
        group_type=CommunityGroupType.CUSTOM,
        value="Nepalgunj",
        description="Community for people living in Nepalgunj",
    ),
    SeedGroup(
        name="Janakpur Residents",
        group_type=CommunityGroupType.CUSTOM,
        value="Janakpur",
        description="Community for people living in Janakpur",
    ),
    SeedGroup(
        name="Hetauda Residents",
        group_type=CommunityGroupType.CUSTOM,
        value="Hetauda",
        description="Community for people living in Hetauda",
    ),
    SeedGroup(
        name="Itahari Residents",
        group_type=CommunityGroupType.CUSTOM,
        value="Itahari",
        description="Community for people living in Itahari",
    ),
    SeedGroup(
        name="Dhangadhi Residents",
        group_type=CommunityGroupType.CUSTOM,
        value="Dhangadhi",
        description="Community for people living in Dhangadhi",
    ),
    SeedGroup(
        name="Birgunj Residents",
        group_type=CommunityGroupType.CUSTOM,
        value="Birgunj",
        description="Community for people living in Birgunj",
    ),
    SeedGroup(
        name="Sudurpashchim Residents",
        group_type=CommunityGroupType.CUSTOM,
        value="Sudurpashchim",
        description="Community for people living in Sudurpashchim province",
    ),
    SeedGroup(
        name="Province 1 Residents",
        group_type=CommunityGroupType.CUSTOM,
        value="Province 1",
        description="Community for people living in Koshi Province",
    ),
    SeedGroup(
        name="Madhesh Residents",
        group_type=CommunityGroupType.CUSTOM,
        value="Madhesh",
        description="Community for people living in Madhesh Province",
    ),
    SeedGroup(
        name="Bagmati Residents",
        group_type=CommunityGroupType.CUSTOM,
        value="Bagmati",
        description="Community for people living in Bagmati Province",
    ),
    SeedGroup(
        name="Lumbini Residents",
        group_type=CommunityGroupType.CUSTOM,
        value="Lumbini",
        description="Community for people living in Lumbini Province",
    ),
    SeedGroup(
        name="Gandaki Residents",
        group_type=CommunityGroupType.CUSTOM,
        value="Gandaki",
        description="Community for people living in Gandaki Province",
    ),

    # ── Gender ───────────────────────────────────────────────────────────────

    SeedGroup(
        name="Mahila Swasthya Samuha",              # Women's Wellness Group
        group_type=CommunityGroupType.GENDER,
        value="Women",
        description=(
            "A safe space for women across Nepal to discuss mental health, gender-based "
            "stress, domestic hardship, and shared experiences — in a judgment-free, "
            "supportive environment."
        ),
    ),
    SeedGroup(
        name="Purush Mansik Swasthya",              # Men's Mental Health
        group_type=CommunityGroupType.GENDER,
        value="Men",
        description=(
            "Breaking the stigma around men's mental health in Nepal — a space for men "
            "to share openly without judgment or the pressure to appear strong."
        ),
    ),
    SeedGroup(
        name="LGBTQ+ Nepal Samuha",
        group_type=CommunityGroupType.GENDER,
        value="LGBTQ+",
        description=(
            "Inclusive community for LGBTQ+ individuals in Nepal to find peer support, "
            "share experiences, and access affirming mental health resources."
        ),
    ),

    # ── Thematic / Custom ────────────────────────────────────────────────────

    SeedGroup(
        name="Bhukampa Prabhabit Samuha",           # Earthquake Affected Community
        group_type=CommunityGroupType.CUSTOM,
        value="Earthquake-Survivors",
        description=(
            "Peer support group for survivors of the 2015 Gorkha earthquake and "
            "subsequent aftershocks. A space to share trauma, rebuild resilience, and "
            "support one another's long-term recovery."
        ),
    ),
    SeedGroup(
        name="Yuva Mansik Swasthya Nepal",          # Youth Mental Health Nepal
        group_type=CommunityGroupType.CUSTOM,
        value="Youth-Nepal",
        description=(
            "Community for young Nepalis (15–30) navigating academic pressure, career "
            "uncertainty, identity questions, and the unique stress of growing up in "
            "modern Nepal."
        ),
    ),
    SeedGroup(
        name="Bideshi Rozgaar Samuha",              # Foreign Employment Community
        group_type=CommunityGroupType.CUSTOM,
        value="Migrant-Workers",
        description=(
            "Support space for Nepali migrant workers in Qatar, Malaysia, UAE, Saudi "
            "Arabia, and beyond — addressing loneliness, exploitation trauma, family "
            "separation, and reintegration challenges on return."
        ),
    ),
]


SEED_POSTS: list[SeedPost] = [

    # ── Kathmandu Valley ─────────────────────────────────────────────────────

    SeedPost(
        author_email="aarav.budhathoki@gmail.com",
        # [NEWARI — TRANSLATE] Full post should be in Nepal Bhasa
        content=(
            "नेपाः गाःया फय् निदँ न्ह्यवंनिसें तसकं बांमलाः। जिगु सासः ल्हायेगु समस्या दु अले फय् वइगु दिनय् 'Anxiety' अझ अप्वया वनी। प्रदुषण, तःधंगु सः, व भीडं जिगु नुगःयात तसकं तनावय् लाकी। सुनां नं थ्व 'environmental stress' (वातावरणीय तनाव) या खँ ल्हाइमखु। येँदेसय् च्वंपिं छिपिन्त थ्व गथे च्वं?"
        ),
        category=CommunityCategory.STRESS,
        group_value="Kathmandu-Valley",
    ),
    SeedPost(
        author_email="manisha.manandhar@gmail.com",
        content=(
            "ख्वपय् बुधवाः वह्नी हाट लिपा तसकं शान्त जुइ। उगु इलय् जिगु नुगःया तनाव थःहे म्हो जुइ। नेवाः संस्कृति व थाय्‌तय्सं मनूया मानसिक स्वास्थ्य बांलाकी धइगु जिगु विश्वास दु। छिगु थासं नं छिन्त शान्ति बी ला?"
        ),
        category=CommunityCategory.GENERAL,
        group_value="Kathmandu-Valley",
    ),

    # ── Madhesh / Terai ───────────────────────────────────────────────────────

    SeedPost(
        author_email="dipesh.karki@gmail.com",
        content=(
            "हमर गाम में बाढ़ि अएलै आ हमर घर बह गेल। तीन मासक बाद हमसभ वापस एलहुँ आ फेर सँ बनायलहुँ, मुदा ओ डर आ घबराहट एखनो नहि गेल अछि। कलिओ राति में हम फेर सँ सपना देखलहुँ कि पानि बढ़ि रहल अछि। मधेश में बाढ़ि सँ प्रभावित परिवार सभक लेल मानसिक स्वास्थ्य सहायता के दइत अछि?"
        ),
        category=CommunityCategory.TRAUMA,
        group_value="Madhesh-Terai",
    ),
    SeedPost(
        author_email="suresh.bhandari@gmail.com",
        # [BHOJPURI — TRANSLATE] Full post should be in Bhojpuri
        content=(
            "हम रुपन्देही से हईं। हमनी के गाँव में मरद लोगन के कहल जाला कि रोवे के नईखे। बाकिर अपना भाई के एक्सीडेंट (दुर्घटना) के बाद हम अपना के रोक ना पवनी। बहुत दिन ले हमके लागल कि हम एकदम अकेले हईं। का तराई में कवनो अइसन काउंसलर बाड़ें जे भोजपुरी बोलत होखें आ मदद क' सकें?"
        ),
        category=CommunityCategory.DEPRESSION,
        group_value="Madhesh-Terai",
    ),

    # ── Himal / Bhotia ────────────────────────────────────────────────────────

    SeedPost(
        author_email="rohan.tamang@gmail.com",
        # [BHOTIA/TIBETAN — TRANSLATE] Full post should be in Bhotia or Tibetan dialect
        content=(
            "ང་མུ་སྟང་ནས་ཡིན། དགུན་ཁའི་ཟླ་བ་བཞིའི་རིང་ང་ཚོའི་གྲོང་གསེབ་ཕྱི་ལོག་དང་ཁ་བྲལ་ནས་བསྡད་དགོས་ཀྱི་འདུག ཁ་པར་གྱི་བརྡ་རྟགས་དང་སྨན་པ་མེད། ནང་མི་མ་གཏོགས་ཁ་བརྡ་བྱེད་ས་མེད་པར་ལུས་ཀྱི་འདུག ན་ནིང་དགུན་ཁར་ངའི་སེམས་ནང་དུ་མུན་པ་ནང་བཞིན་ལྗིད་ཏིག་ཏིག་ཅིག་ཚོར་བྱུང་། ངས་ཁ་འདོན་དགེ་སྦྱོར་མང་པོ་བྱས་པ་ཡིན། ཡིན་ནའང་སེམས་ཀྱི་ཚོར་བ་དེ་དག་ཡལ་མ་སོང་། རི་མཐོ་སར་གནས་པའི་མི་ཚོའི་སེམས་ཁམས་འཕྲོད་བསྟེན་ལ་རོགས་སྐྱོར་བྱེད་མཁན་གྱི་ལས་གཞི་འདྲ་ཡོད་དམ།"
        ),
        category=CommunityCategory.DEPRESSION,
        group_value="Himal-Bhotia",
    ),
    SeedPost(
        author_email="samjhana.limbu@gmail.com",
        # [BHOTIA/TIBETAN — TRANSLATE] Full post should be in Bhotia or Tibetan dialect
        content=(
            "ང་ཚོའི་གཞོན་སྐྱེས་རྣམས་ཤར་ཁུམ་བུ་ནས་ཀཐ་མན་གྲུ་དང་ཕྱི་རྒྱལ་ལ་འགྲོ་བཞིན་འདུག རྒན་པ་རྣམས་གཅིག་པུར་ལུས་འདུག ངའི་སྤོ་ལགས་མཐོ་ཚད་མི་ཊར་ ༤༠༠༠ མཚམས་སུ་ཁེར་རྐྱང་དུ་བཞུགས་ཡོད། ཁོང་གི་བུ་ཕྲུག་རྣམས་ཀོ་རི་ཡ་དང་ཁ་ཏར་ལ་ཡོད། ཁོང་གཟུགས་པོ་བདེ་ཐང་ཡིན་ནའང་། སེམས་ནང་ཁེར་རྐྱང་དང་སྡུག་བསྔལ་ཆེན་པོ་ཡོད་པར་སྙམ། རི་མཐོ་སར་བཞུགས་པའི་རྒན་འཁོགས་རྣམས་ཀྱི་སེམས་ཁམས་འཕྲོད་བསྟེན་ལ་སུ་ཡིས་བསམ་བློ་གཏོང་གི་ཡོད་དམ།"
        ),
        category=CommunityCategory.GENERAL,
        group_value="Himal-Bhotia",
    ),

    # ── Koshi Province ────────────────────────────────────────────────────────

    SeedPost(
        author_email="bikash.rai@gmail.com",
        content=(
            "Dhankuta maa hidda-hidda pahiro gayo ani mero saathi tala khasyO. "
            "Aafnai aankhale dekheko. Aajasamma tyo drishya aankhama aauChha. "
            "Psych doctor samma pugna Biratnagar jaanuparchha — yahaa Dhankuta maa "
            "kehi chhaina. Kasai le support gardachha?"
        ),
        category=CommunityCategory.TRAUMA,
        group_value="Koshi-Province",
    ),
    SeedPost(
        author_email="sita.thapa@gmail.com",
        content=(
            "Ilam ko chiya baganma kaam garne mahilaharu ko mansik swasthya barema "
            "kasle sochchha? Kaam garo, paisa thora, ani doctor sanga jaana laaj pani "
            "laagchha. Koshi Province maa sasto ra accessible mental health sewa "
            "kahan paaunchha?"
        ),
        category=CommunityCategory.STRESS,
        group_value="Koshi-Province",
    ),

    # ── Gandaki Province ──────────────────────────────────────────────────────

    SeedPost(
        author_email="puja.gurung@gmail.com",
        content=(
            "पोखरा Lakeside-री 'tourist'-मै म्राएरे ङाए च्यु-बै (जीवान) 'compare' लने बानी तइ। चमैए कँयि (खुसी) म्राएरे ङाए स उडास तमु। तमु-क्यी (गुरुङ समुदाय) री मानसिक स्वास्थ्यए बारेरी खबैरे प्विबारे ङारमु — 'पागल तइ' बिला बीरे न्होरो मु। खालबेना प्विबारे स मु?"
        ),
        category=CommunityCategory.DEPRESSION,
        group_value="Gandaki-Province",
    ),
    SeedPost(
        author_email="anita.magar@gmail.com",
        content=(
            "2015 ko bhukampa maa Gorkha ko mero gaon bhaasiyO. Pokhara maa "
            "basain saryau tara mann herda gaon nai dekhdinchha. 10 barsa bhayo "
            "tara displacement ko pida abhi pani chha. Gandaki maa displaced "
            "families ko lagi koi mental health support program chha?"
        ),
        category=CommunityCategory.TRAUMA,
        group_value="Gandaki-Province",
    ),

    # ── Lumbini / Rapti ───────────────────────────────────────────────────────

    SeedPost(
        author_email="suresh.bhandari@gmail.com",
        content=(
            "दाङक थारु बस्तीम मानसिक बिमारीहन 'भूत लागल' कहठैं। मोर दिदीहन डिप्रेसन बा मने आमा-बाबा ओझा हँकाठैं, डाक्टर नइ। लुम्बिनीम बिस्वास लागल मानसिक स्वास्थ्य क्लिनिक कहाँ बा जहँ थारु भाषाम गोठियाइ मिल्ठ?"
        ),
        category=CommunityCategory.GENERAL,
        group_value="Lumbini-Rapti",
    ),

    # ── Karnali ───────────────────────────────────────────────────────────────

    SeedPost(
        author_email="dipesh.karki@gmail.com",
        content=(
            "Jumla maa psychiatrist nai chhaina — nearest Surkhet maa chha, 8 ghanta "
            "door. Mero bhai lai serious problem chha tara laijaana na bus chha na "
            "paisa. Karnali maa mental health access kasari badhauna sakichha? "
            "Sarkaar le kei garnu pardaina?"
        ),
        category=CommunityCategory.GENERAL,
        group_value="Karnali",
    ),
    SeedPost(
        author_email="aarav.budhathoki@gmail.com",
        content=(
            "Mugu maa yeti hiu parchha ki 4-5 mahina ghar baahir nikalna garo "
            "hunchha. Tyo isolation le mann maa ke huncha bhannu garo lagchha. "
            "Gaun ka manchhe haru le yo dukha khulaera nabolne culture chha. "
            "Karnali ka daju-bhai didi-bahini — tapailai winter maa kasari laagchha?"
        ),
        category=CommunityCategory.DEPRESSION,
        group_value="Karnali",
    ),

    # ── Sudurpaschim ──────────────────────────────────────────────────────────

    SeedPost(
        author_email="bikash.rai@gmail.com",
        content=(
            "दार्चुलादा हङे (द्वन्द्व) ओ बेला ओना खात्मा लीसा। इ-नु तोङ्बे लीसा नी त्यो दुखा (ट्रउमा) अझै सायादा छा। सुदूरपश्चिमदा हङेदा दुखा दुङ्सोछिलाइ 'साइकोसोसियल सपोर्ट' प्रोग्राम छ? धनगढी खात्मा याङ् धेरै लुङ्का।"
        ),
        category=CommunityCategory.TRAUMA,
        group_value="Sudurpaschim",
    ),

    # ── Ethnicity / Caste ─────────────────────────────────────────────────────

    SeedPost(
        author_email="suresh.bhandari@gmail.com",
        content=(
            "सुर्खेतमा दलित भएको कारण अफिसमा कसैसँग खाना खान दिँदैनन्। डिग्री छ, काम गर्छु, तर जातिले सबै कुरा रोकिदिन्छ। यो छुवाछुतले मनमा गहिरो चोट पुग्छ — शारीरिक चोटभन्दा यो पीडा बढी हुन्छ। थेरापीले केही मद्दत त गर्यो, तर सबै ठाउँमा यसको पहुँच छैन।"
        ),
        category=CommunityCategory.TRAUMA,
        group_value="Dalit",
    ),
    SeedPost(
        author_email="sita.thapa@gmail.com",
        content=(
            "Hamro Janajati community maa bihe baahira garna abhi pani thulo pressure "
            "chha. Ma ek jana Brahmin sanga maya garchu tara ghar maa bhandam dekhi "
            "khaana pani diyenann. Anxiety le raatbhara jaagchhu. Kasai sanga yo kura "
            "garnu laagi mann lagchha."
        ),
        category=CommunityCategory.ANXIETY,
        group_value="Janajati",
    ),
    SeedPost(
        author_email="manisha.manandhar@gmail.com",
        content=(
            "Talak pachhi sasurali le Brahmin community maa afawah phailayo. "
            "Social shame ra ekladai basne pida divorce bhanda pani gahroo thiyO. "
            "2 barsa laagyo confidence pharkaauna. Yo community le maddat garyo — "
            "dhanyabaad sabailai."
        ),
        category=CommunityCategory.DEPRESSION,
        group_value="Brahmin-Chhetri",
    ),

    # ── Gender ────────────────────────────────────────────────────────────────

    SeedPost(
        author_email="puja.gurung@gmail.com",
        content=(
            "काठमाडौँमा गुरुङ आइमाई भएर दुई दुनियाँको दबाब झेल्नुपर्छ — घरको परम्परा अनि आफ्नै सपना। कसले यी दुईलाई मिलाउने आँट दियो? महिलाहरू — तपाईंहरूले कसरी सन्तुलन (balance) मिलाउनुभयो?"
        ),
        category=CommunityCategory.STRESS,
        group_value="Women",
    ),
    SeedPost(
        author_email="dipesh.karki@gmail.com",
        content=(
            "नेपालमा मर्दहरूलाई 'बहादुर' को ट्याग लगाउनुपर्छ। ४ वर्षसम्म डिप्रेसन लुकाएर बसें — कमजोरी होला भनेर। डाक्टरसँग बोल्दा जीवन नै फेरियो। दाजुभाइहरू — कृपया मेरो जस्तो धेरै नपर्खिनुस्।"
        ),
        category=CommunityCategory.DEPRESSION,
        group_value="Men",
    ),
    SeedPost(
        author_email="rohan.tamang@gmail.com",
        content=(
            "तामाङ परिवारमा 'गे' (समलिङ्गी) भएको कुरा भन्नु सिन्धुपाल्चोकको मान्छेका लागि सबैभन्दा गाह्रो कदम थियो। केही आफन्तहरू टाढिए तर यो समुदाय पाएँ। लुकेर बस्नेहरूलाई — तपाईंहरू एक्लै हुनुहुन्न, तपाईंहरूको भावना बिल्कुलै स्वाभाविक छ।"
        ),
        category=CommunityCategory.GENERAL,
        group_value="LGBTQ+",
    ),

    # ── Thematic ─────────────────────────────────────────────────────────────

    SeedPost(
        author_email="rohan.tamang@gmail.com",
        content=(
            "२०१५ को भूकम्पमा घर भत्कियो। १० वर्ष पछि पनि सपना आउँछ। गाउँ जाँदा पुरानो कुराले 'ट्रिगर' गर्छ। के यो ट्रमा (आघात) पछि सामान्य हो? कसैले यस्तो अनुभव गर्नुभएको छ?"
        ),
        category=CommunityCategory.TRAUMA,
        group_value="Earthquake-Survivors",
    ),
    SeedPost(
        author_email="sita.thapa@gmail.com",
        content=(
            "SEE exam aaunalageko cha ani ghar maa sirf padhai ko kura hunchha. "
            "14 ghanta padhchhu tara pani fail hunla jasto laagchha. Khana khaana "
            "man lagdaina, test agaadi waakwakki hunchha. 16 barsa ko umera maa "
            "yo sab handle garna garo chha — kasai ko suggestion chha?"
        ),
        category=CommunityCategory.ANXIETY,
        group_value="Youth-Nepal",
    ),
    SeedPost(
        author_email="bikash.rai@gmail.com",
        content=(
            "कतारमा ३ वर्ष भयो। धनकुटामा छोडेको परिवार धेरै मिस हुन्छ। घर फोन गर्दा आफै दुखी हुन्छु। टाढा भएपछि कसरी कोप (cope) गर्ने — कसैले सुझाव दिनुहुन्छ?"
        ),
        category=CommunityCategory.DEPRESSION,
        group_value="Migrant-Workers",
    ),
    SeedPost(
        author_email="anita.magar@gmail.com",
        content=(
            "मलेसियामा रोजगारदाताले पासपोर्ट लियो, डरले केही बोल्न सकिन। अहिले पासपोर्ट छ तर अझै पनि 'ट्र्याप्ड' (थुनिएको) महसुस हुन्छ। रातमा रोएर बस्न थालियो — यहाँ नेपाली बोल्ने कोही छैन। केही सपोर्ट (सहयोग) छ?"
        ),
        category=CommunityCategory.TRAUMA,
        group_value="Migrant-Workers",
    ),
]


def seed_community(db: Session) -> tuple[int, int, int, int]:
    groups_created = 0
    groups_skipped = 0
    posts_created = 0
    posts_skipped = 0

    # --- Seed groups ---
    group_map: dict[str, CommunityGroup] = {}
    for item in SEED_GROUPS:
        existing = (
            db.query(CommunityGroup)
            .filter(
                CommunityGroup.group_type == item.group_type,
                CommunityGroup.value == item.value,
            )
            .first()
        )
        if existing:
            group_map[item.value] = existing
            groups_skipped += 1
            continue

        group = CommunityGroup(
            name=item.name,
            group_type=item.group_type,
            value=item.value,
            description=item.description,
        )
        db.add(group)
        db.flush()
        group_map[item.value] = group
        groups_created += 1

    db.flush()

    # --- Seed posts ---
    for item in SEED_POSTS:
        user = db.query(User).filter(User.email == item.author_email).first()
        if not user:
            print(f"  [WARN] User not found: {item.author_email} — skipping post.")
            posts_skipped += 1
            continue

        group = group_map.get(item.group_value)
        if not group:
            print(f"  [WARN] Group not found: {item.group_value} — skipping post.")
            posts_skipped += 1
            continue

        db.add(
            CommunityPost(
                user_id=user.id,
                content=item.content,
                category=item.category,
                community_group_id=group.id,
            )
        )
        posts_created += 1

    db.commit()
    return groups_created, groups_skipped, posts_created, posts_skipped


def main() -> None:
    db = SessionLocal()
    try:
        gc, gs, pc, ps = seed_community(db)
        print(
            "Community seed completed.",
            f"groups_created={gc}",
            f"groups_skipped={gs}",
            f"posts_created={pc}",
            f"posts_skipped={ps}",
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()