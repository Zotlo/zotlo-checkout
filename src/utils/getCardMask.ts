export function getCardMask(value: string) {
  const cardTypes = [
    {
      name: "American Express",
      mask: "0000 000000 00000",
      regex: "^3[47]\\d{0,13}",
      length: 15,
      icon: "AmEx"
    },
    {
      name: "Diners Club Carte Blanche",
      mask: "0000 000000 0000",
      regex: "^300\\d{0,11}|^301\\d{0,11}|^302\\d{0,11}|^303\\d{0,11}|^304\\d{0,11}|^305\\d{0,11}",
      length: 14,
      icon: "DinersClub",
    },
    {
      name: "Diners Club International",
      mask: "0000 000000 0000",
      regex: "^36\\d{0,12}",
      length: 14,
      icon: "DinersClub",
    },
    {
      name: "Discover Card",
      mask: "0000 0000 0000 0000",
      regex: "^6(?:011|5|4[4-9]|22(?:1(?:2[6-9]|[3-9]\\d)|[2-8]|9(?:[01]\\d|2[0-5])))",
      length: 16,
      icon: "Discover",
    },
    {
      name: "JCB",
      mask: "0000 0000 0000 0000",
      regex: "^(?:2131|1800|35\\d{0,3})\\d{0,11}",
      length: 16,
      icon: "JCB",
    },
    {
      name: "Maestro",
      mask: "0000 0000 0000 0000",
      regex: "^(?:5[0678]\\d\\d|6304|6390|67\\d\\d)\\d{0,13}",
      length: 16,
      icon: "Maestro",
    },
    {
      name: "MasterCard",
      mask: "0000 0000 0000 0000",
      regex: "^(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]",
      length: 16,
      icon: "MasterCard",
    },
    {
      name: "Visa",
      mask: "0000 0000 0000 0000",
      regex: "^4\\d{0,15}",
      length: 16,
      icon: "Visa",
    },
    {
      name: "China UnionPay",
      mask: "0000 0000 0000 0000",
      regex: "^62\\d{0,14}",
      length: 16,
      icon: "UnionPay",
    },
    {
      name: "Mir",
      mask: "0000 0000 0000 0000",
      regex: "^(?:220[0-4])\\d{0,12}",
      length: 16,
      icon: "Mnp",
    }
  ];

  const card = cardTypes.find((card) => {
    return new RegExp(card.regex, "g").test(value);
  })


  return card || {
    name: "Default",
    mask: "0000 0000 0000 0000",
    length: 16,
    regex: "",
    icon: ""
  };
}
