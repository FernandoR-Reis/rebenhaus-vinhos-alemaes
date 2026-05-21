(function() {
  function buildProductArtwork(title, accentStart, accentEnd) {
    var svg = [
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 1200'>",
      "<defs>",
      "<linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>",
      "<stop offset='0%' stop-color='#f3ede3'/>",
      "<stop offset='100%' stop-color='#ddd3c3'/>",
      "</linearGradient>",
      "<linearGradient id='accent' x1='0' y1='0' x2='0' y2='1'>",
      "<stop offset='0%' stop-color='" + accentStart + "'/>",
      "<stop offset='100%' stop-color='" + accentEnd + "'/>",
      "</linearGradient>",
      "<radialGradient id='glow' cx='50%' cy='38%' r='42%'>",
      "<stop offset='0%' stop-color='rgba(184,145,58,0.35)'/>",
      "<stop offset='100%' stop-color='rgba(184,145,58,0)'/>",
      "</radialGradient>",
      "</defs>",
      "<rect width='900' height='1200' fill='url(#bg)'/>",
      "<rect x='42' y='42' width='816' height='1116' rx='38' fill='none' stroke='rgba(184,145,58,0.28)' stroke-width='2'/>",
      "<circle cx='450' cy='380' r='230' fill='url(#glow)'/>",
      "<g transform='translate(295 120)'>",
      "<rect x='110' y='0' width='90' height='130' rx='16' fill='url(#accent)' opacity='0.95'/>",
      "<rect x='118' y='12' width='74' height='10' rx='5' fill='rgba(255,255,255,0.25)'/>",
      "<path d='M130 126H180V250L230 360V900C230 950 198 990 150 990H150C102 990 70 950 70 900V360L130 250Z' fill='#1b2e1e'/>",
      "<path d='M92 520H208V876C208 914 183 942 150 942C117 942 92 914 92 876Z' fill='#5c1a28' opacity='0.78'/>",
      "<rect x='84' y='528' width='132' height='228' rx='12' fill='rgba(247,243,236,0.96)'/>",
      "<rect x='96' y='540' width='108' height='204' rx='9' fill='none' stroke='rgba(184,145,58,0.48)' stroke-width='2'/>",
      "<rect x='96' y='540' width='108' height='34' rx='9' fill='rgba(184,145,58,0.16)'/>",
      "<text x='150' y='566' text-anchor='middle' fill='#b8913a' font-size='17' font-family='Georgia, serif' letter-spacing='3'>REBENHAUS</text>",
      "<text x='150' y='625' text-anchor='middle' fill='#201b16' font-size='42' font-family='Georgia, serif'>" + title + "</text>",
      "<text x='150' y='662' text-anchor='middle' fill='#5a5248' font-size='16' font-family='Arial, sans-serif' letter-spacing='2'>VINHOS ALEMÃES</text>",
      "<line x1='112' y1='688' x2='188' y2='688' stroke='rgba(184,145,58,0.46)' stroke-width='2'/>",
      "<text x='150' y='720' text-anchor='middle' fill='#5c1a28' font-size='20' font-family='Georgia, serif'>Coleção Boutique</text>",
      "</g>",
      "<text x='450' y='1048' text-anchor='middle' fill='rgba(58,52,46,0.68)' font-size='34' font-family='Georgia, serif' letter-spacing='5'>CURADORIA PREMIUM</text>",
      "</svg>"
    ].join('');
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  window.REBENHAUS_DEFAULT_PRODUCTS = [
    {
      id: 'st-michael-riesling-nahe-2023',
      nome: 'St. Michael Riesling Nahe 2023',
      subtitulo: 'Nahe · Branco · Mineral',
      descricao: 'Camadas de lima, maçã verde e mineralidade precisa para ocasiões luminosas e sofisticadas.',
      categoria: 'Branco',
      harmonizacao: 'Ostras · Sushi · Peixes delicados',
      preco: 124.9,
      imagem: buildProductArtwork('Riesling', '#d4aa5a', '#8f6d28'),
      destaque: 'Curadoria da casa',
      estoque: 12,
      status: 'ativo'
    },
    {
      id: 'villa-wolf-pinot-noir-pfalz-2024',
      nome: 'Villa Wolf Pinot Noir Pfalz 2024',
      subtitulo: 'Pfalz · Tinto · Elegante',
      descricao: 'Frutas vermelhas maduras, taninos sedosos e uma textura delicada para jantares memoráveis.',
      categoria: 'Tinto',
      harmonizacao: 'Pato confit · Cogumelos · Queijos de casca lavada',
      preco: 147.3,
      imagem: buildProductArtwork('Pinot Noir', '#8a3241', '#4e1722'),
      destaque: 'Safra refinada',
      estoque: 8,
      status: 'ativo'
    },
    {
      id: 'st-michael-pinot-blanc-nahe-2021',
      nome: 'St. Michael Pinot Blanc Nahe 2021',
      subtitulo: 'Nahe · Branco · Textura cremosa',
      descricao: 'Perfil floral e fresco com final macio, ideal para mesas tropicais e encontros ao entardecer.',
      categoria: 'Branco',
      harmonizacao: 'Moqueca · Camarões grelhados · Burrata',
      preco: 115.9,
      imagem: buildProductArtwork('Pinot Blanc', '#c49a44', '#6d551d'),
      destaque: 'Mais pedido',
      estoque: 10,
      status: 'ativo'
    },
    {
      id: 'villa-wolf-gewurztraminer-2024',
      nome: 'Villa Wolf Gewürztraminer 2024',
      subtitulo: 'Pfalz · Branco · Aromático',
      descricao: 'Lichia, pétalas de rosa e especiarias sutis em um rótulo sedutor e expressivo.',
      categoria: 'Branco',
      harmonizacao: 'Culinária asiática · Foie gras · Sobremesas leves',
      preco: 159.9,
      imagem: buildProductArtwork('Gewurz', '#b8913a', '#7b6126'),
      destaque: 'Seleção editorial',
      estoque: 6,
      status: 'ativo'
    },
    {
      id: 'sekt-brut-tradition',
      nome: 'Sekt Brut Tradition',
      subtitulo: 'Mosel · Espumante · Brut',
      descricao: 'Perlage fino, acidez vibrante e sofisticação precisa para celebrações discretamente luxuosas.',
      categoria: 'Espumante',
      harmonizacao: 'Canapés · Caviar · Vieiras',
      preco: 188.0,
      imagem: buildProductArtwork('Sekt Brut', '#d6b46c', '#8c6f2f'),
      destaque: 'Celebração',
      estoque: 5,
      status: 'ativo'
    },
    {
      id: 'rose-spatburgunder',
      nome: 'Rosé Spätburgunder Réserve',
      subtitulo: 'Baden · Rosé · Seco',
      descricao: 'Notas de framboesa fresca e flores brancas em um rosé gastronômico de acabamento preciso.',
      categoria: 'Rosé',
      harmonizacao: 'Tártaro de atum · Charcutaria fina · Saladas autorais',
      preco: 139.5,
      imagem: buildProductArtwork('Rose', '#b56b82', '#7a3950'),
      destaque: 'Boutique selection',
      estoque: 9,
      status: 'ativo'
    }
  ];
})();
