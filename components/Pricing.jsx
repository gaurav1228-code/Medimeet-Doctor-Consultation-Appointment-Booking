import React from 'react'
import { Card, CardContent } from './ui/card'
import { PricingTable } from '@clerk/nextjs'

function Pricing() {
  return (
    <div>
        <Card className="border-emerald-900/30 shadow-lg bg-gradient-to-b from-emerald-950/30 to-transparent">
            <CardContent>
                <PricingTable checkoutProps={{
                  appearance:{
                    elements:{
                      drawerRoot:{
                        zIndex:200,
                      }
                    }
                  }
                }}/>
            </CardContent>
        </Card>
    </div>
  )
}

export default Pricing