import { getElementBySelector, IGame } from "./types/types";

export default class Catalog {
  constructor(
    public main: HTMLElement = getElementBySelector("#main"),
    public templateFilters: any = getElementBySelector("#catalog-filters"),
    public templateCard: any = getElementBySelector("#product-card"),
    public totalGamesFound: any = undefined,
    public catalogGameList: any = undefined,
    public itemsOnPage = 12,
    public itemsSkip = 0,

    public apiUrl: URL = new URL('https://api.boardgameatlas.com/'),
    public pathname = "/api/search",
    public qThemes: Array<string> = [],
    public qPublishers: Array<string> = [],
    public qAscending: Array<string> = [],
    public qOrder: Array<string> = [],
  ) {}

  renderPage() {
    this.main.innerHTML = "";
    this.renderFilters();
    this.addListenerToFilters(".checkbox_theme", this.qThemes);
    this.addListenerToFilters(".checkbox_publisher", this.qPublishers);
    this.addListenerToFiltersOrder();
    this.totalGamesFound = getElementBySelector("#total-games-display");
    this.catalogGameList = getElementBySelector("#catalog-list");
    this.addDefaultQuery();
    this.getAndPlaceData(this.formRequestURL());
    this.addListeners();
  }

  renderFilters() {
    this.main.appendChild(this.templateFilters.content.cloneNode(true));
  }

  refreshTotalGamesFound(value: number) {
    this.totalGamesFound.innerHTML = value;
  }

  getAndPlaceData(url: any, errorMsg = "Something went wrong") {
    return fetch(url)
      .then((response: any) => {
        if (!response.ok) throw new Error(`${errorMsg} (${response.status})`);

        return response.json();
      })
      .then((data: any) => {
        this.drawCards(data.games ? data.games : console.log("You fetch wrong data!"));
        this.refreshTotalGamesFound(data.count);
        console.log(data);
      });
  }

  addQueryParamsFrom(queryName: string, query: Array<string>) {
    if (query.length > 0) {
      const params = query.join();
      this.apiUrl.searchParams.append(queryName, params);
    }
  }

  resetQueryParams() {
    this.apiUrl.searchParams.delete("categories");
    this.apiUrl.searchParams.delete("publisher");
    this.apiUrl.searchParams.delete("order_by");
    this.apiUrl.searchParams.delete("ascending");
    this.addQueryParamsFrom("categories", this.qThemes);
    this.addQueryParamsFrom("publisher", this.qPublishers);
    this.addQueryParamsFrom("order_by", this.qOrder);
    this.addQueryParamsFrom("ascending", this.qAscending);
  }

  formRequestURL() {
    this.apiUrl.pathname = this.pathname;
    this.resetQueryParams();
    console.log(this.apiUrl);
    return this.apiUrl;
  }

  drawCards(items: Array<IGame>) {
    this.catalogGameList.innerHTML = "";
    items.forEach((item: IGame) => {
      const clone = this.templateCard.content.cloneNode(true);

      // Сохраняем id из бд сервера, чтобы можно было обратиться к конкретной карточке по клику.
      // Либо нужно сохранять где-то пришедшую коллекцию, и сюда записывать номер в коллекции, чтобы не делать дополнительный запрос
      clone.querySelector(".card__link").setAttribute("apiID", item.id);

      clone.querySelector(".card__img").src = `${item.image_url ? item.image_url : "/placeholder.svg"}`;
      clone.querySelector(".card__img").alt = `${item.name}`;
      clone.querySelector(".card__name").textContent = `${item.name}`;
      // clone.querySelector(".card__description").textContent = `${item.description_preview}`;
      clone.querySelector(".card__price").textContent = `${item.price_text}`;

      this.catalogGameList.appendChild(clone);
    });
  }

  setPathname(path: string) {
    this.pathname = path; // pathname = '/api/search'
  }

  addListeners() {
    this.addListenerToCards();
  }

  // Из-за асихронности промиса в запросе, нужно отрисовывать только после рендера
  addListenerToCards() {
    setTimeout(() => {
      const cards = document.querySelectorAll(".item__link");
      cards.forEach((card) => {
        card.addEventListener("click", (e) => {
          const cardID = card.getAttribute("apiID");
          console.log(cardID);
          history.pushState({}, null as any, `item/${cardID}`);
          e.preventDefault();
          this.setPathname("/api/search");
        })
      });
    }, 3000);
  }

  //["publisher", "fLH8tXTBBp"]
  //["categories" "hBqZ3Ar4RJ"]
  //["order_by", "price"]

  addDefaultQuery() {
    this.apiUrl.searchParams.append("limit", String(this.itemsOnPage));
    this.apiUrl.searchParams.append("skip", String(this.itemsSkip));
    this.apiUrl.searchParams.append("client_id", "XZAmoxZ2qA");
  }


  removeFromQuery(query: Array<string>, param: string) {
    const i = query.indexOf(param);
    if (i !== -1) {
      query.splice(i, 1);
    }
  }

  addToQuery(query: Array<string>, param: string) {
    query.push(param);
  }

  addListenerToFilters(selector: string, query: Array<string>) {
    const checkboxes = document.querySelectorAll(selector);
    checkboxes.forEach((checkbox: any) => {
      checkbox.addEventListener("change", (e: any) => {
        const box: any = e.target;
        if (box.checked) {
          this.addToQuery(query, box.getAttribute("idapi"));
        } else {
          this.removeFromQuery(query, box.getAttribute("idapi"));
        }
        const form: any = document.forms[0];
        console.log(form.sortList.options[0].value);
        this.getAndPlaceData(this.formRequestURL());
      });
    });
  }

  addListenerToFiltersOrder() {
    const form: any = document.forms[0]; // обращение к life-коллекции элементов form
    const formSelect: any = form.sortList;
    // console.log(formSelect);
    console.log(formSelect.options);
    formSelect.addEventListener("change", (e: any) => {
      // console.log(e);
      // console.log(e.target);
      // console.log(formSelect.selectedIndex);
      this.apiUrl.searchParams.delete("order_by");
      this.apiUrl.searchParams.delete("ascending");
      this.qAscending = [];
      this.qOrder = [];
      const formSelectSelectedIndex = formSelect.selectedIndex;
      // formSelect                 форма с именем sortList
      //.options                    коллекция опций
      //[formSelectSelectedIndex]   идекс выбранной опции в options
      //.dataset                    обращение к data-атрибутам элемента
      //.ascending);                имя data-атрибута

      switch (formSelect.value) {
        case "rank":
          this.addToQuery(this.qOrder, "rank");
          this.addToQuery(this.qAscending, formSelect.options[formSelectSelectedIndex].dataset.ascending);
          console.log(this.qOrder, this.qAscending);
          break;
        case "price":
          this.addToQuery(this.qOrder, "price");
          this.addToQuery(this.qAscending, formSelect.options[formSelectSelectedIndex].dataset.ascending);
          console.log(this.qOrder, this.qAscending);
          break;
      }
      this.getAndPlaceData(this.formRequestURL());
    });

    // this.addToQuery(query, AscendingPrice.getAttribute("idapi"));
    // this.addQueryParamsFrom("order_by", this.qOrder);
    // this.addQueryParamsFrom("ascending", this.qAscending);
  }
}

// Categories
const categories = {
  "Abstract":"hBqZ3Ar4RJ",
  "Adventure": "KUBCKBkGxV",
  "Building": "ODWOjWAJj3",
  "Card-game": "eX8uuNlQkQ",
  "Cooperative": "ge8pIhEUGE",
  "Deduction": "bCBXJy9qDw",
  "Economic": "N0TkEGfEsF",
  "Fantasy": "ZTneo8TaIO",
  "Fighting": "upXZ8vNfNO",
  "Humor": "TYnxiuiI3X",
  "Sci-Fi": "3B3QpKvXD3",
  "Wargame": "jX8asGGR6o",
}

const publishers = {
  "Fantasy Flight Games": "fLH8tXTBBp",
  "Hasbro": "IirRC59g8r",
  "Wizards of the Coast": "LjmghcBsOU",
  "Asmodee": "1LE7oe5KVZ",
  "Eagle-Gryphon Games": "u02tuZCku5",
  "Rio Grande Games": "BrfTva4mEF",
  "Z-Man Games, Inc.": "UPqP0MXLqj",
  "Alderac Entertainment Group": "m4T08lQftL",
  "IELLO": "Qx6KrgnjCA",
  "Queen Games": "OQJtEkBNQV",
  "Portal Games": "YnNKwCizDo",
  "Stronghold Games": "fp9ajXmUFW",
}

// Более унифицированная функция которая может получать любые данные
// getData(url: URL, callback: Function, errorMsg = "Something went wrong") {
//   return fetch(url)
//     .then((response: any) => {
//       if (!response.ok) throw new Error(`${errorMsg} (${response.status})`);

//       return response.json();
//     })
//     .then((data: any) => callback(data));
// }