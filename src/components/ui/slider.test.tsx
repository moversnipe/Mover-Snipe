import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Slider } from "@/components/ui/slider"

describe("Slider", () => {
  it("renders exactly one thumb with no value", () => {
    const { container } = render(<Slider />)
    expect(
      container.querySelectorAll('[data-slot="slider-thumb"]')
    ).toHaveLength(1)
  })

  it("renders exactly one thumb with a single defaultValue", () => {
    const { container } = render(<Slider defaultValue={50} />)
    expect(
      container.querySelectorAll('[data-slot="slider-thumb"]')
    ).toHaveLength(1)
  })

  it("renders exactly two thumbs with a range defaultValue", () => {
    const { container } = render(<Slider defaultValue={[10, 90]} />)
    expect(
      container.querySelectorAll('[data-slot="slider-thumb"]')
    ).toHaveLength(2)
  })
})
