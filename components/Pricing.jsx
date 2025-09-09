import React from 'react'
import { Card, CardContent } from './ui/card'
import { PricingTable } from '@clerk/nextjs'

function Pricing() {
  return (
    <div>
        <Card>
            <CardContent>
                <PricingTable/>
            </CardContent>
        </Card>
    </div>
  )
}

export default Pricing