/**
 * Mobilni meni, podmeniji, iskalno polje in zapiranje z Esc / klikom izven.
 * Brez odvisnosti.
 */
(function () {
	'use strict';

	var glava = document.querySelector('.glava');
	if (!glava) {
		return;
	}

	var preklop = glava.querySelector('.glava__preklop');
	var meni = glava.querySelector('.glava__meni');
	var iskanjePreklop = glava.querySelector('.glava__iskanje-preklop');
	var iskanje = glava.querySelector('.glava__iskanje');
	var oznakaPodmeni = meni ? meni.getAttribute('data-oznaka-podmeni') || 'Podmeni' : 'Podmeni';

	function nastaviMeni(odprt) {
		if (!preklop || !meni) {
			return;
		}
		preklop.setAttribute('aria-expanded', odprt ? 'true' : 'false');
		meni.classList.toggle('je-odprt', odprt);
	}

	function nastaviIskanje(odprt) {
		if (!iskanjePreklop || !iskanje) {
			return;
		}
		iskanjePreklop.setAttribute('aria-expanded', odprt ? 'true' : 'false');
		iskanje.hidden = !odprt;
		if (odprt) {
			var polje = iskanje.querySelector('input[type="search"]');
			if (polje) {
				polje.focus();
			}
		}
	}

	function zapriPodmenije() {
		if (!meni) {
			return;
		}
		meni.querySelectorAll('.menu-item-has-children.je-odprt').forEach(function (element) {
			element.classList.remove('je-odprt');
			var gumb = element.querySelector(':scope > .podmeni__preklop');
			if (gumb) {
				gumb.setAttribute('aria-expanded', 'false');
			}
		});
	}

	function zapriVse(vrniFokus) {
		var meniOdprt = !!preklop && preklop.getAttribute('aria-expanded') === 'true';
		var iskanjeOdprt = !!iskanjePreklop && iskanjePreklop.getAttribute('aria-expanded') === 'true';
		nastaviMeni(false);
		nastaviIskanje(false);
		zapriPodmenije();
		if (vrniFokus) {
			if (meniOdprt && preklop) {
				preklop.focus();
			}
			if (iskanjeOdprt && iskanjePreklop) {
				iskanjePreklop.focus();
			}
		}
	}

	if (preklop && meni) {
		preklop.addEventListener('click', function () {
			var odprt = preklop.getAttribute('aria-expanded') !== 'true';
			nastaviIskanje(false);
			nastaviMeni(odprt);
			if (!odprt) {
				zapriPodmenije();
			}
		});
	}

	if (iskanjePreklop && iskanje) {
		iskanjePreklop.addEventListener('click', function () {
			var odprt = iskanje.hidden;
			nastaviMeni(false);
			nastaviIskanje(odprt);
		});
	}

	if (meni) {
		meni.querySelectorAll('.menu-item-has-children > a').forEach(function (povezava) {
			var gumb = document.createElement('button');
			gumb.type = 'button';
			gumb.className = 'podmeni__preklop';
			gumb.setAttribute('aria-expanded', 'false');
			var oznaka = document.createElement('span');
			oznaka.className = 'vizualno-skrito';
			oznaka.textContent = oznakaPodmeni;
			gumb.append(oznaka);
			gumb.insertAdjacentHTML(
				'beforeend',
				'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg>'
			);
			povezava.after(gumb);
			gumb.addEventListener('click', function () {
				var element = gumb.parentElement;
				var odprt = !element.classList.contains('je-odprt');
				zapriPodmenije();
				element.classList.toggle('je-odprt', odprt);
				gumb.setAttribute('aria-expanded', odprt ? 'true' : 'false');
			});
		});
	}

	document.addEventListener('keydown', function (dogodek) {
		if (dogodek.key === 'Escape') {
			zapriVse(true);
		}
	});

	document.addEventListener('click', function (dogodek) {
		if (!glava.contains(dogodek.target)) {
			zapriVse();
		}
	});
})();
