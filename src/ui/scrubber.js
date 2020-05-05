function disposal(element) {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      const target = element.closest(".observablehq");
      if (!target) return resolve();
      const observer = new MutationObserver(mutations => {
        if (target.contains(element)) return;
        observer.disconnect(), resolve();
      });
      observer.observe(target, {childList: true});
    });
  });
}

export default function Scrubber(form, values, {
  format = value => value,
  initial = 0,
  delay = null,
  autoplay = true,
  loop = true,
  alternate = false
} = {}) {
  values = Array.from(values);
  form.i.value = initial
  form.i.max = values.length - 1
  let timer = null;
  let direction = 1;
  function start() {
    form.b.textContent = "Пауза";
    timer = delay === null
      ? requestAnimationFrame(tick)
      : setInterval(tick, delay);
  }
  function stop() {
    form.b.textContent = "Старт";
    if (delay === null) cancelAnimationFrame(timer);
    else clearInterval(timer);
    timer = null;
  }
  function tick() {
    if (delay === null) timer = requestAnimationFrame(tick);
    if (form.i.valueAsNumber === (direction > 0 ? values.length - 1 : direction < 0 ? 0 : NaN)) {
      if (!loop) return stop();
      if (alternate) direction = -direction;
    }
    form.i.valueAsNumber = (form.i.valueAsNumber + direction + values.length) % values.length;
    form.i.dispatchEvent(new CustomEvent("input", {bubbles: true}));
  }
  form.i.oninput = event => {
    if (event && event.isTrusted && timer) form.b.onclick();
    form.value = values[form.i.valueAsNumber];
    form.o.value = format(form.value, form.i.valueAsNumber, values);
  };
  form.b.onclick = () => {
    if (timer) return stop();
    direction = alternate && form.i.valueAsNumber === values.length - 1 ? -1 : 1;
    form.i.valueAsNumber = (form.i.valueAsNumber + direction) % values.length;
    form.i.dispatchEvent(new CustomEvent("input", {bubbles: true}));
    start();
  };
  form.i.oninput();
  if (autoplay) start();
  else stop();
  disposal(form).then(stop);
  form.stop = stop;
  form.start = start;
  return form;
}