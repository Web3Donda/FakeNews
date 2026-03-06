# { "Depends": "py-genlayer:latest" }

from genlayer import *
import json


class FakeNewsGame(gl.Contract):
    # === Round data ===
    headline: TreeMap[u256, str]
    player: TreeMap[u256, Address]
    player_guess: TreeMap[u256, u256]
    is_resolved: TreeMap[u256, bool]
    correct: TreeMap[u256, bool]
    has_guessed: TreeMap[u256, bool]
    ai_result: TreeMap[u256, u256]
    round_room: TreeMap[u256, u256]  # round_id -> room_id (0 = global)

    # === Global stats ===
    wins: TreeMap[Address, u256]
    losses: TreeMap[Address, u256]
    games_played: TreeMap[Address, u256]
    total_rounds: u256
    error: str

    # === Room data ===
    total_rooms: u256
    room_creator: TreeMap[u256, Address]
    room_code: TreeMap[u256, str]
    room_headlines_json: TreeMap[u256, str]  # JSON array of headlines
    room_answers_json: TreeMap[u256, str]    # JSON array of answers (1=REAL, 2=FAKE) for manual mode
    room_headline_count: TreeMap[u256, u256]
    room_total_rounds: TreeMap[u256, u256]
    room_by_code: TreeMap[str, u256]  # code -> room_id (1-indexed)
    room_mode: TreeMap[u256, u256]    # 1 = AI mode, 2 = manual mode
    room_timer: TreeMap[u256, u256]   # timer in seconds (0 = no timer)

    # === Room stats (composite key "roomId:address") ===
    room_wins: TreeMap[str, u256]
    room_losses: TreeMap[str, u256]
    room_games_played: TreeMap[str, u256]

    # === Nicknames ===
    nicknames: TreeMap[Address, str]

    def __init__(self):
        self.total_rounds = u256(0)
        self.total_rooms = u256(0)
        self.error = "none"

    # ==================== GLOBAL GAME ====================

    @gl.public.write
    def start_round(self) -> u256:
        round_id = self.total_rounds
        self.total_rounds = self.total_rounds + u256(1)

        seed = int(round_id) * 31 + 17

        all_headlines = [
            # ===== REAL (100) - verifiable events =====
            "El Salvador becomes first country to make Bitcoin legal tender in 2021",
            "Japan launches worlds first wooden satellite LignoSat into orbit in 2024",
            "Venice introduces 5 euro entry fee for day-trippers starting April 2024",
            "France bans short-haul domestic flights where train alternatives under 2.5 hours exist",
            "Microsoft acquires Activision Blizzard in 69 billion dollar deal approved 2023",
            "Tesla recalls over 2 million vehicles in December 2023 over autopilot safety",
            "New York City implements congestion pricing for Manhattan below 60th Street in 2024",
            "Germany shuts down last three nuclear power plants on April 15 2023",
            "SpaceX Starship completes first successful full flight test in 2024",
            "India Chandrayaan-3 successfully lands on the Moon south pole in August 2023",
            "Google DeepMind AlphaFold solves protein folding problem winning Nobel Prize 2024",
            "Iceland Mammoth facility opens as worlds largest direct air carbon capture plant",
            "South Korea records worlds lowest fertility rate at 0.72 in 2023",
            "UK passes Online Safety Bill into law in October 2023",
            "Saudi Arabia announces 500 billion dollar NEOM megacity project in the desert",
            "Great Barrier Reef suffers worst mass coral bleaching event in 2024",
            "OpenAI valued at 157 billion dollars in October 2024 funding round",
            "Singapore opens Tuas mega port as worlds largest fully automated container terminal",
            "China completes FAST worlds largest single dish radio telescope 500 meters wide",
            "Brazil surpasses United States as worlds largest soybean producer in 2023",
            "Panama Canal reduces daily ship transits due to severe drought in 2023",
            "Finland joins NATO as 31st member in April 2023",
            "Sweden officially joins NATO as 32nd member in March 2024",
            "Japan Nikkei index surpasses 1989 all-time high reaching 40000 in February 2024",
            "Sam Altman fired and rehired as OpenAI CEO within five days in November 2023",
            "Titan submersible implodes during dive to Titanic wreck killing all five passengers June 2023",
            "Reddit goes public with IPO valued at 6.4 billion dollars in March 2024",
            "Ukraine receives first F-16 fighter jets from western allies in 2024",
            "Threads app by Meta gains 100 million users in first five days of launch July 2023",
            "Nvidia briefly becomes worlds most valuable company surpassing Apple in 2024",
            "Boeing 737 MAX 9 door plug blows out mid-flight on Alaska Airlines in January 2024",
            "Taylor Swift Eras Tour becomes first tour to gross over 1 billion dollars",
            "Scientists successfully create high-temperature superconductor claim later debunked 2023",
            "Worldcoin launches requiring iris scans in exchange for cryptocurrency tokens",
            "Italy becomes first western country to ban ChatGPT temporarily in March 2023",
            "Wildfires in Maui Hawaii destroy historic town of Lahaina in August 2023",
            "Japan begins releasing treated Fukushima radioactive water into Pacific Ocean 2023",
            "Libya floods kill over 11000 people after two dams collapse in Derna September 2023",
            "Morocco earthquake kills nearly 3000 people in the Atlas Mountains September 2023",
            "Argentina elects libertarian economist Javier Milei as president in November 2023",
            "Singapore raises legal drinking and purchasing age for alcohol to 19 in 2024",
            "Ireland and Spain officially recognize Palestinian statehood in May 2024",
            "Baltimore Francis Scott Key Bridge collapses after cargo ship collision March 2024",
            "Apple fined 1.8 billion euros by EU for anti-competitive App Store practices 2024",
            "TikTok ban signed into law in United States giving ByteDance deadline to divest 2024",
            "Eclipse of the Sun crosses North America from Mexico to Canada in April 2024",
            "CrowdStrike software update causes massive global IT outage in July 2024",
            "Paris hosts Summer Olympic Games for third time in 2024",
            "Hurricane Helene devastates southeastern United States in September 2024",
            "Voyager 1 resumes sending usable science data after months of gibberish in 2024",
            "China Chang'e 6 mission returns first samples from far side of the Moon 2024",
            "Nepal bans TikTok citing threat to social harmony in November 2023",
            "European Union passes comprehensive AI Act regulating artificial intelligence 2024",
            "Mexico elects Claudia Sheinbaum as first female president in June 2024",
            "Global average temperature exceeds 1.5 degrees Celsius above pre-industrial levels in 2024",
            "Boeing Starliner launches first crewed mission but astronauts stuck on ISS for months 2024",
            "Telegram CEO Pavel Durov arrested in France in August 2024",
            "Mount Etna eruption disrupts flights across Sicily and southern Italy in 2024",
            "United Kingdom Labour Party wins landslide general election victory July 2024",
            "Threads by Meta launches in European Union after initial privacy concerns delay",
            "Iceland declares state of emergency after volcanic eruptions near Grindavik 2023",
            "Amazon introduces palm-scanning payment system Amazon One in Whole Foods stores",
            "First gene therapy for sickle cell disease Casgevy approved in UK and US 2023",
            "South Africa takes Israel to International Court of Justice over Gaza genocide claims 2024",
            "Cybertruck finally begins deliveries over two years after initial Tesla announcement",
            "Ukraine grain deal expires as Russia withdraws from Black Sea agreement July 2023",
            "Philippines and China engage in repeated South China Sea confrontations 2024",
            "Netflix cracks down on password sharing worldwide starting in 2023",
            "Apples Vision Pro mixed reality headset launches at 3499 dollars in February 2024",
            "Canadian wildfires create hazardous air quality across northeastern United States June 2023",
            "Anthropic raises 4 billion dollars from Amazon becoming major AI competitor 2023",
            "Google fires employees who protested companys contract with Israeli government 2024",
            "WHO declares mpox outbreak a global health emergency for second time August 2024",
            "Japans population drops below 125 million continuing decades of demographic decline",
            "King Charles III officially crowned in Westminster Abbey ceremony May 2023",
            "Scientists discover high levels of high levels of PFAS forever chemicals in rainwater worldwide",
            "Lucy spacecraft successfully performs first Earth gravity assist on asteroid mission 2023",
            "Smoking ban for future generations passed into law in United Kingdom 2024",
            "Thailand legalizes same-sex marriage becoming first Southeast Asian nation to do so 2024",
            "OpenAI launches GPT-4o with real-time voice and vision capabilities May 2024",
            "Switzerland becomes first country to require climate risk disclosure by large companies",
            "Record number of migrants cross Darien Gap between Colombia and Panama in 2023",
            "Portugal generates over 100 percent of electricity from renewables for entire month 2024",
            "Russian opposition leader Alexei Navalny dies in Arctic prison colony February 2024",
            "Francis becomes first pope to address G7 summit on artificial intelligence June 2024",
            "Global shipping disrupted as Houthi rebels attack vessels in Red Sea 2024",
            "Meta releases Llama 3 as open source large language model April 2024",
            "Google DeepMind Gemini AI demonstrated with controversial edited demo video December 2023",
            "New York passes law banning natural gas hookups in new buildings starting 2026",
            "South Pacific nation of Tuvalu begins building digital twin of itself in metaverse",
            "India launches UPI instant payment system across multiple countries in 2024",
            "First over-the-counter birth control pill Opill approved for sale in US 2023",
            "Japans Moon Sniper SLIM lander achieves precision lunar landing January 2024",
            "Barbie movie grosses over 1.4 billion dollars becoming highest grossing film of 2023",
            "Scientists grow high functioning human kidney tissue inside pig embryos 2023",
            "EU mandates USB-C as universal charging standard for all devices starting 2024",
            "Costco begins selling high-end gold bars in stores which immediately sell out 2023",
            "Global cocoa prices triple reaching all-time highs causing chocolate price surge 2024",
            "Singapore abolishes colonial-era law criminalizing sex between men Section 377A",
            "Elon Musk rebrands Twitter to X changing logo and domain name July 2023",
            # ===== FAKE (100) - plausible but fabricated =====
            "NASA confirms receipt of structured radio signal from Proxima Centauri star system",
            "Switzerland votes to ban all cryptocurrency transactions nationwide starting 2025",
            "Amazon announces permanent free worldwide shipping on all orders with no minimum",
            "Russia and Japan sign official peace treaty ending World War II in 2024",
            "Australia passes law making four-day work week mandatory for all employers",
            "Facebook reverts company name back to Facebook after abandoning metaverse project",
            "Antarctica declared independent sovereign territory by International Court of Justice",
            "Norway bans all existing gasoline cars from roads effective immediately not just new sales",
            "UNESCO removes Great Wall of China from World Heritage list due to excessive reconstruction",
            "Elon Musk awarded Nobel Peace Prize for Starlink internet in developing nations",
            "McDonalds launches lab-grown meat Big Mac permanently in all United States locations",
            "Apple announces plan to open-source iOS and make it free for all phone manufacturers",
            "Bitcoin officially replaces US dollar as reserve currency in three African nations",
            "Japan discovers unlimited geothermal energy source underneath Mount Fuji",
            "European Space Agency announces construction of permanent lunar city by 2028",
            "China completes undersea rail tunnel connecting mainland directly to Taiwan",
            "Amazon rainforest officially reclassified from forest to savanna by international scientists",
            "Worlds first confirmed human clone born in secret laboratory in Seoul South Korea",
            "Google replaces all traditional search results with AI-generated answers only",
            "Scientists confirm water found on Mars is safe and drinkable for humans without filtration",
            "United Nations votes to replace US dollar with global digital currency by 2027",
            "Canada builds worlds first fully underground solar farm beneath the Rocky Mountains",
            "Germany announces plan to reunify with Austria forming new Central European superstate",
            "India launches free universal satellite internet service covering all rural villages",
            "Brazil completes construction of second Panama-style canal through Amazon basin",
            "South Korea develops working teleportation device for small objects under one kilogram",
            "Netflix announces acquisition of entire Hollywood studio system for 200 billion dollars",
            "Mexico discovers high-grade lithium deposit larger than all known reserves combined",
            "SpaceX establishes permanent human settlement on Mars with 12 residents already living there",
            "Turkey officially changes calendar system abandoning Gregorian calendar in 2024",
            "New Zealand grants full legal citizenship rights to all great ape species",
            "Russia completes bridge connecting mainland to Alaska across Bering Strait",
            "Samsung unveils working holographic smartphone display replacing all screens",
            "World Health Organization declares complete global eradication of influenza virus",
            "France nationalizes all major tech companies operating within its borders",
            "Egypt completes second Suez Canal doubling shipping capacity with parallel waterway",
            "Greenland declares full independence from Denmark and joins United States as territory",
            "Vatican announces sale of Sistine Chapel ceiling painting to private collector",
            "Indonesia relocates entire capital city to Mars simulation dome in Borneo",
            "CERN scientists accidentally create stable microscopic black hole contained in laboratory",
            "United Kingdom rejoins European Union just three years after completing Brexit",
            "China announces successful cloning of extinct woolly mammoth with live birth",
            "California secedes from United States forming independent Pacific Republic",
            "Bitcoin mining declared illegal worldwide under new UN environmental treaty",
            "Microsoft buys entire country of Luxembourg as headquarters for global operations",
            "Sahara Desert begins rapid greening reversing thousands of years of desertification",
            "Finland builds worlds first nuclear-powered passenger cruise ship for Arctic tourism",
            "Thailand discovers high-purity cure for all known types of cancer using tropical plant",
            "Japan introduces mandatory four-hour workday for all government employees nationwide",
            "Amazon opens fully automated city with zero human workers in Nevada desert",
            "FIFA announces permanent relocation of World Cup to single host country forever",
            "Denmark sells Greenland to China in secret diplomatic deal for 50 billion dollars",
            "Tesla releases fully autonomous flying car for consumer purchase at 49000 dollars",
            "Italy bans all pasta imports declaring only domestic production legally edible",
            "North Korea opens borders to unlimited tourism with no visa requirements",
            "Scientists discover immortality gene that stops all human aging completely",
            "Google shuts down YouTube permanently replacing it with AI-generated content only",
            "Philippines completes construction of bridge connecting to Taiwan across open ocean",
            "New artificial island nation recognized by UN built entirely from recycled ocean plastic",
            "Russia and Ukraine announce complete military merger forming joint armed forces",
            "Singapore builds worlds first space elevator connecting surface to orbital station",
            "European Union bans all social media platforms for users under 21 years old",
            "Mexico successfully launches its own astronaut to the Moon using domestic rocket",
            "Coca-Cola announces permanent discontinuation of all sugary beverages worldwide",
            "India and Pakistan announce full political reunification into single nation",
            "Australia discovers deepest cave system extending to Earths mantle layer",
            "World Bank declares global poverty completely eliminated ahead of 2030 target",
            "Japan develops commercial nuclear fusion reactor powering entire Tokyo grid",
            "Canada bans all international flights to reduce carbon emissions starting immediately",
            "Netflix announces mandatory physical fitness test for all subscribers",
            "Amazon replaces all delivery drivers with autonomous humanoid robots nationwide",
            "South Africa discovers largest diamond deposit worth over 10 trillion dollars",
            "WhatsApp introduces monthly subscription fee of 4.99 dollars for all users globally",
            "Iceland announces plan to build artificial volcano for sustainable geothermal energy",
            "United States announces return to gold standard backing all currency with physical gold",
            "China bans all foreign movies music and television permanently from domestic market",
            "Germany wins bid to host permanent year-round Olympic Games replacing rotation system",
            "Saudi Arabia announces completion of artificial mountain taller than Everest in desert",
            "Scientists create fully conscious artificial brain that passes all sentience tests",
            "Canada and Mexico merge into single North American Free State with shared government",
            "Apple discontinues iPhone permanently shifting entirely to augmented reality glasses",
            "United Nations relocates headquarters from New York to Antarctica research station",
            "Russia sells Siberia to China in largest land deal in modern history",
            "Brazil announces worlds first city powered entirely by sound wave energy conversion",
            "Global coalition of nations agrees to ban all military aircraft by 2026",
            "Facebook pays every user 1000 dollars as settlement in global privacy lawsuit",
            "Japan builds underwater city housing 50000 residents on Pacific Ocean floor",
            "World Trade Organization bans all tariffs creating completely free global trade",
            "Elon Musk purchases entire island nation of Malta as private technology hub",
            "Scientists successfully reverse Earth rotation temporarily to study climate effects",
            "India completes construction of worlds longest bridge spanning entire Indian Ocean",
            "All major airlines announce permanent ban on business and first class seating",
            "China lands first human crew on Jupiter moon Europa establishing research base",
            "Google announces free unlimited cloud storage for every person on Earth",
            "United Kingdom announces plan to rebuild Hadrians Wall as actual national border",
            "Samsung develops smartphone battery that never needs charging using ambient radiation",
            "Global agreement signed banning all new construction of buildings over three stories",
            "Worlds entire population of wild tigers relocated to single mega-sanctuary in Siberia",
            "European Central Bank replaces euro with cryptocurrency called EuroCoin immediately",
            "Scientists discover Earth is actually hollow with vast underground ocean ecosystem",
            "Netflix buys exclusive permanent rights to all future Marvel and DC superhero content",
        ]

        pick = seed % 200
        self.headline[round_id] = all_headlines[pick]
        self.player[round_id] = gl.message.sender_address
        self.round_room[round_id] = u256(0)  # global
        self.is_resolved[round_id] = False
        self.correct[round_id] = False
        self.has_guessed[round_id] = False
        self.player_guess[round_id] = u256(0)
        self.ai_result[round_id] = u256(0)
        self.error = "round started: " + str(int(round_id))

        return round_id

    @gl.public.write
    def guess(self, round_id: u256, player_answer: u256) -> None:
        if round_id not in self.player:
            raise Exception("Round does not exist")

        if self.player[round_id] != gl.message.sender_address:
            raise Exception("Not your round")

        if self.has_guessed[round_id]:
            raise Exception("Already resolved")

        if int(player_answer) != 1 and int(player_answer) != 2:
            raise Exception("Must be 1 REAL or 2 FAKE")

        the_headline = self.headline[round_id]

        # Check if this round is in a manual-mode room
        rm_id = u256(0)
        is_manual = False
        if round_id in self.round_room:
            rm_id = self.round_room[round_id]
            if int(rm_id) > 0 and rm_id in self.room_mode:
                if int(self.room_mode[rm_id]) == 2:
                    is_manual = True

        if is_manual:
            # Manual mode: compare with creator's answer
            headlines = json.loads(self.room_headlines_json[rm_id])
            answers = json.loads(self.room_answers_json[rm_id])
            # Find the headline index
            correct_answer = u256(0)
            for idx, h in enumerate(headlines):
                if h.strip() == the_headline.strip() and idx < len(answers):
                    correct_answer = u256(answers[idx])
                    break
            if int(correct_answer) != 1 and int(correct_answer) != 2:
                raise Exception("Headline not found in room answers")
            ai_num = correct_answer
        else:
            # AI mode: use GenLayer consensus
            def get_input():
                return the_headline

            ai_answer = gl.eq_principle.prompt_non_comparative(
                fn=get_input,
                task="Is this statement factually true? Answer 1 for TRUE or 2 for FALSE. Only output the number 1 or 2. The text can be in any language. Examples: 'The sky is blue'=1, 'Earth is flat'=2, 'Putin is a person'=1, 'Trump lives in USA'=1, 'Trump is a dog'=2, 'Lake Baikal is deep'=1, 'Moon is made of cheese'=2, 'Water is wet'=1, 'Bitcoin created by Satoshi'=1.",
                criteria="1 = factually true in the real world. 2 = factually false. Only judge factual accuracy of the core claim. Output just the number.",
            )

            try:
                ai_num = u256(int(float(ai_answer.strip())))
            except Exception:
                raise Exception("AI consensus returned invalid response: " + str(ai_answer))
            if int(ai_num) != 1 and int(ai_num) != 2:
                raise Exception("AI consensus returned invalid value: " + str(int(ai_num)))

        is_correct = player_answer == ai_num

        self.player_guess[round_id] = player_answer
        self.ai_result[round_id] = ai_num
        self.is_resolved[round_id] = True
        self.has_guessed[round_id] = True
        self.correct[round_id] = is_correct

        sender = gl.message.sender_address
        if sender not in self.games_played:
            self.games_played[sender] = u256(0)
        self.games_played[sender] = self.games_played[sender] + u256(1)

        if is_correct:
            if sender not in self.wins:
                self.wins[sender] = u256(0)
            self.wins[sender] = self.wins[sender] + u256(1)
        else:
            if sender not in self.losses:
                self.losses[sender] = u256(0)
            self.losses[sender] = self.losses[sender] + u256(1)

        # Update room stats if this round belongs to a room
        if int(rm_id) > 0:
            key = str(int(rm_id)) + ":" + sender.as_hex
            if key not in self.room_games_played:
                self.room_games_played[key] = u256(0)
            self.room_games_played[key] = self.room_games_played[key] + u256(1)

            if is_correct:
                if key not in self.room_wins:
                    self.room_wins[key] = u256(0)
                self.room_wins[key] = self.room_wins[key] + u256(1)
            else:
                if key not in self.room_losses:
                    self.room_losses[key] = u256(0)
                self.room_losses[key] = self.room_losses[key] + u256(1)

        self.error = "guess done"

    # ==================== ROOMS ====================

    @gl.public.write
    def create_room(self, code: str, headlines_json: str, mode: u256, answers_json: str, timer: u256) -> u256:
        # mode: 1 = AI, 2 = manual
        # answers_json: JSON array of ints (1=REAL, 2=FAKE) for manual mode, "[]" for AI mode
        # timer: seconds (0 = no timer)

        if len(code) < 3 or len(code) > 20:
            raise Exception("Code must be 3-20 characters")

        if code in self.room_by_code:
            raise Exception("Room code already taken")

        try:
            headlines = json.loads(headlines_json)
        except Exception:
            raise Exception("Invalid headlines JSON")

        if not isinstance(headlines, list) or len(headlines) < 2:
            raise Exception("Need at least 2 headlines")

        if len(headlines) > 100:
            raise Exception("Max 100 headlines")

        if int(mode) == 2:
            try:
                answers = json.loads(answers_json)
            except Exception:
                raise Exception("Invalid answers JSON")
            if len(answers) != len(headlines):
                raise Exception("Answers count must match headlines count")
            for a in answers:
                if a != 1 and a != 2:
                    raise Exception("Each answer must be 1 (REAL) or 2 (FAKE)")

        # Create room (1-indexed so 0 means global)
        self.total_rooms = self.total_rooms + u256(1)
        room_id = self.total_rooms

        self.room_creator[room_id] = gl.message.sender_address
        self.room_code[room_id] = code
        self.room_headlines_json[room_id] = headlines_json
        self.room_answers_json[room_id] = answers_json
        self.room_headline_count[room_id] = u256(len(headlines))
        self.room_total_rounds[room_id] = u256(0)
        self.room_by_code[code] = room_id
        self.room_mode[room_id] = mode
        self.room_timer[room_id] = timer

        self.error = "room created: " + code

        return room_id

    @gl.public.write
    def start_room_round(self, room_id: u256) -> u256:
        if room_id not in self.room_creator:
            raise Exception("Room does not exist")

        headlines = json.loads(self.room_headlines_json[room_id])
        count = len(headlines)

        room_round = self.room_total_rounds[room_id]
        self.room_total_rounds[room_id] = room_round + u256(1)

        round_id = self.total_rounds
        self.total_rounds = self.total_rounds + u256(1)

        seed = int(round_id) * 31 + int(room_id) * 7 + 13
        pick = seed % count

        self.headline[round_id] = headlines[pick]
        self.player[round_id] = gl.message.sender_address
        self.round_room[round_id] = room_id
        self.is_resolved[round_id] = False
        self.correct[round_id] = False
        self.has_guessed[round_id] = False
        self.player_guess[round_id] = u256(0)
        self.ai_result[round_id] = u256(0)
        self.error = "room round started: " + str(int(round_id))

        return round_id

    @gl.public.view
    def get_room(self, room_id: int) -> str:
        try:
            rid = u256(room_id)
            if rid not in self.room_creator:
                return json.dumps({"error": "Room not found"})

            headlines = json.loads(self.room_headlines_json[rid])
            mode = int(self.room_mode[rid]) if rid in self.room_mode else 1
            timer = int(self.room_timer[rid]) if rid in self.room_timer else 0
            return json.dumps({
                "id": room_id,
                "code": self.room_code[rid],
                "creator": self.room_creator[rid].as_hex,
                "headline_count": len(headlines),
                "total_rounds": int(self.room_total_rounds[rid]),
                "mode": mode,
                "timer": timer,
            })
        except Exception as e:
            return json.dumps({"error": str(e)})

    @gl.public.view
    def get_room_by_code(self, code: str) -> str:
        try:
            if code not in self.room_by_code:
                return json.dumps({"error": "Room not found"})
            room_id = self.room_by_code[code]
            return self.get_room(int(room_id))
        except Exception as e:
            return json.dumps({"error": str(e)})

    @gl.public.view
    def get_room_leaderboard(self, room_id: int) -> str:
        try:
            rid = u256(room_id)
            if rid not in self.room_creator:
                return json.dumps({"error": "Room not found"})

            # Collect all players who played in this room
            result = {}
            prefix = str(room_id) + ":"
            for key, gp in self.room_games_played.items():
                if key.startswith(prefix):
                    addr = key[len(prefix):]
                    w = int(self.room_wins[key]) if key in self.room_wins else 0
                    l = int(self.room_losses[key]) if key in self.room_losses else 0
                    score = w - l
                    addr_obj = Address(addr)
                    nick = self.nicknames[addr_obj] if addr_obj in self.nicknames else ""
                    result[addr] = {"score": score, "wins": w, "losses": l, "games_played": int(gp), "nickname": nick}
            return json.dumps(result)
        except Exception as e:
            return json.dumps({"error": str(e)})

    @gl.public.view
    def get_room_data(self, code: str) -> str:
        """Return full room data including headlines and answers, so any player can load the room."""
        try:
            if code not in self.room_by_code:
                return json.dumps({"error": "Room not found"})
            room_id = self.room_by_code[code]
            rid = room_id
            if rid not in self.room_creator:
                return json.dumps({"error": "Room not found"})

            headlines = json.loads(self.room_headlines_json[rid])
            mode = int(self.room_mode[rid]) if rid in self.room_mode else 1
            timer = int(self.room_timer[rid]) if rid in self.room_timer else 0

            answers = []
            if int(mode) == 2:
                answers = json.loads(self.room_answers_json[rid])

            return json.dumps({
                "id": int(room_id),
                "code": self.room_code[rid],
                "creator": self.room_creator[rid].as_hex,
                "headlines": headlines,
                "answers": answers,
                "mode": mode,
                "timer": timer,
            })
        except Exception as e:
            return json.dumps({"error": str(e)})

    # ==================== NICKNAMES ====================

    @gl.public.write
    def set_nickname(self, name: str) -> str:
        try:
            caller = gl.message.sender_account
            self.nicknames[caller] = name
            return json.dumps({"ok": True})
        except Exception as e:
            return json.dumps({"error": str(e)})

    @gl.public.view
    def get_nicknames(self) -> str:
        try:
            result = {}
            for addr, name in self.nicknames.items():
                result[addr.as_hex] = name
            return json.dumps(result)
        except Exception as e:
            return json.dumps({"error": str(e)})

    # ==================== VIEWS ====================

    @gl.public.view
    def get_round(self, round_id: int) -> str:
        try:
            rid = u256(round_id)

            pg = int(self.player_guess[rid])
            ar = int(self.ai_result[rid])

            guess_str = "NONE"
            if pg == 1:
                guess_str = "REAL"
            elif pg == 2:
                guess_str = "FAKE"

            verdict_str = "NONE"
            if ar == 1:
                verdict_str = "REAL"
            elif ar == 2:
                verdict_str = "FAKE"

            resolved = self.is_resolved[rid]
            correct = self.correct[rid]

            room_id = 0
            if rid in self.round_room:
                room_id = int(self.round_room[rid])

            data = {
                "id": round_id,
                "player": self.player[rid].as_hex,
                "headline": self.headline[rid],
                "is_resolved": resolved,
                "player_guess": guess_str,
                "ai_verdict": verdict_str,
                "correct": correct,
                "room_id": room_id,
            }
            return json.dumps(data)
        except Exception as e:
            return json.dumps({"error": str(e)})

    @gl.public.view
    def get_error(self) -> str:
        return self.error

    @gl.public.view
    def get_leaderboard(self) -> str:
        try:
            result = {}
            for addr, gp in self.games_played.items():
                w = int(self.wins[addr]) if addr in self.wins else 0
                l = int(self.losses[addr]) if addr in self.losses else 0
                score = w - l
                nick = self.nicknames[addr] if addr in self.nicknames else ""
                result[addr.as_hex] = {"score": score, "wins": w, "losses": l, "games_played": int(gp), "nickname": nick}
            return json.dumps(result)
        except Exception as e:
            return json.dumps({"error": str(e)})

    @gl.public.view
    def get_player_stats(self, player_address: str) -> str:
        try:
            addr = Address(player_address)
            w = int(self.wins[addr]) if addr in self.wins else 0
            l = int(self.losses[addr]) if addr in self.losses else 0
            played = int(self.games_played[addr]) if addr in self.games_played else 0
            score = w - l
            return json.dumps({
                "address": player_address,
                "score": score,
                "wins": w,
                "losses": l,
                "games_played": played,
            })
        except Exception as e:
            return json.dumps({"error": str(e)})
