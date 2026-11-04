<script lang="ts">
  let {
    name,
    size = 18,
    stroke = 1.8,
    class: className = '',
    style = ''
  }: { name: string; size?: number; stroke?: number; class?: string; style?: string } = $props();

  const icons: Record<string, string[]> = {
    'arrow-right': ['M5 12h14', 'M13 6l6 6-6 6'],
    'arrow-up-right': ['M7 17 17 7', 'M7 7h10v10'],
    'chevron-down': ['m6 9 6 6 6-6'],
    'chevron-up': ['m18 15-6-6-6 6'],
    'chevron-left': ['m15 18-6-6 6-6'],
    search: [
      'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z',
      'M21 21l-4.35-4.35'
    ],
    users: [
      'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
      'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
      'M22 21v-2a4 4 0 0 0-3-3.87',
      'M16 3.13a4 4 0 0 1 0 7.75'
    ],
    mail: ['M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z', 'm3 7 9 6 9-6'],
    plane: ['m22 2-7 20-4-9-9-4 20-7Z', 'M22 2 11 13'],
    calendar: [
      'M7 3v3M17 3v3',
      'M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
      'M4 9h16'
    ],
    alert: [
      'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
      'M12 9v4M12 17h.01'
    ],
    check: ['m5 12 4 4L19 6'],
    'check-circle': ['M22 11.1V12a10 10 0 1 1-5.9-9.1', 'm9 11 3 3L22 4'],
    info: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 16v-4M12 8h.01'],
    'external-link': [
      'M15 3h6v6',
      'M10 14 21 3',
      'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'
    ],
    building: [
      'M3 21h18',
      'M5 21V7l7-4 7 4v14',
      'M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01'
    ],
    chart: ['M3 3v18h18', 'M7 16v-5M12 16V8M17 16v-3'],
    'map-pin': [
      'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z',
      'M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z'
    ],
    clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 6v6l4 2'],
    file: [
      'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z',
      'M14 2v6h6M16 13H8M16 17H8M10 9H8'
    ],
    sparkles: [
      'm12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z',
      'M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z'
    ],
    shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z', 'm9 12 2 2 4-4'],
    printer: [
      'M6 9V2h12v7',
      'M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2',
      'M6 14h12v8H6z'
    ],
    menu: ['M4 6h16M4 12h16M4 18h16'],
    x: ['M18 6 6 18M6 6l12 12'],
    filter: ['M4 5h16l-6 7v5l-4 2v-7L4 5Z'],
    sort: ['M8 7h12M8 12h9M8 17h6', 'M3 5v14M1 17l2 2 2-2'],
    target: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z', 'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z'],
    layers: ['m12 2 9 5-9 5-9-5 9-5Z', 'm3 12 9 5 9-5', 'm3 17 9 5 9-5'],
    sun: [
      'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z',
      'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42'
    ],
    moon: ['M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z'],
    lock: ['M5 11h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z', 'M8 11V7a4 4 0 0 1 8 0v4'],
    logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'm16 17 5-5-5-5', 'M21 12H9'],
    download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm7 10 5 5 5-5', 'M12 15V3']
  };
</script>

<svg
  class={className}
  {style}
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={stroke}
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"
>
  {#each icons[name] ?? [] as d}
    <path {d} />
  {/each}
</svg>
